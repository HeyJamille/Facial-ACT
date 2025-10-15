import { SafeUrl } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// Services
import { AuthService } from '../../services/auth-service/auth-service';
import { ApiService } from '../../services/api-service/api-service';

@Component({
  selector: 'app-face-capture',
  templateUrl: './face-capture.html',
  standalone: true,
  imports: [CommonModule],
})
export class FaceCapture implements AfterViewInit {
  @ViewChild('video') videoRef!: ElementRef<HTMLVideoElement>;

  @Input() isEditMode: boolean = false;
  @Input() person: any;
  @Input() showFaceCapture: boolean = false;

  imagecaptured: string | null = null;
  //imagesafe: SafeUrl | null = null;

  homeCapture: boolean = true;
  showCamera: boolean = false;
  isLoading: boolean = false;
  imageSent: boolean = false;
  loading: boolean = false;

  integracaoOcorrencia?: string;
  facialIntegrada?: string | number;

  isAdmin = false;

  private canvas!: HTMLCanvasElement;
  private stream: MediaStream | null = null;

  constructor(
    private auth: AuthService,
    private api: ApiService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['person'] && this.person?.id) {
      this.api.getPersonById(this.person.id).subscribe({
        next: (res: any) => {
          this.integracaoOcorrencia = res.integracaoOcorrencia;
          this.facialIntegrada = res.facialIntegrada; // S ou outro valor
        },
        error: (err) => console.error('Erro ao buscar usuário:', err),
      });
    }
  }

  ngOnInit(): void {
    this.showImage();

    // Verify if is admin
    this.isAdmin = this.auth.getUserInfo()?.role === 'A';
  }

  ngAfterViewInit(): void {
    this.canvas = document.createElement('canvas');
  }

  startCapture() {
    if (this.imageSent) {
      this.toastr.info('Captura facial já cadastrada. Não é possível enviar outra.');
      return;
    }

    this.homeCapture = false;
    this.showCamera = true;

    if (!navigator.mediaDevices?.getUserMedia) {
      this.toastr.warning('Câmera não suportada neste navegador.');
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        this.stream = stream;
        this.videoRef.nativeElement.srcObject = stream;
      })
      .catch(() => this.toastr.error('Erro ao acessar a câmera.'));
  }

  captureImage() {
    if (this.imageSent) return;

    const video = this.videoRef.nativeElement;
    this.canvas.width = video.videoWidth;
    this.canvas.height = video.videoHeight;

    const ctx = this.canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);

    this.imagecaptured = this.canvas.toDataURL('image/jpeg');
    this.stopCamera();
    localStorage.setItem('imagecaptured', this.imagecaptured);
  }

  sendImage() {
    if (this.imageSent) {
      this.toastr.info('Captura facial já cadastrada. Não é possível enviar outra.');
      return;
    }

    if (!this.imagecaptured) {
      this.toastr.warning('Nenhuma captura facial capturada.');
      return;
    }

    this.loading = true;

    const userId = this.person?.id || this.auth.getUserInfo()?.id;
    if (!userId) {
      this.toastr.error('Usuário não encontrado.', 'Erro');
      this.loading = false;
      return;
    }

    const file = this.dataURLtoFile(this.imagecaptured, 'facial.jpg');
    const formData = new FormData();
    formData.append('file', file);

    this.api.uploadFacial(userId, formData).subscribe({
      next: () => {
        this.toastr.success('Captura facial enviada com sucesso!', 'Sucesso');

        // Blocks recapture and sending
        this.imageSent = true;
        this.showCamera = false;
        this.homeCapture = false;

        // Updates integrationOccurrence and facialIntegrada
        const payload = {
          facialIntegrada: 'N',
          integracaoOcorrencia: 'Aguardando Validação',
        };

        this.api.updateIntegration(userId, payload).subscribe({
          next: () => {
            this.integracaoOcorrencia = payload.integracaoOcorrencia;
            this.facialIntegrada = payload.facialIntegrada;
            this.saveLocalStorage();
          },
          error: () => {
            this.toastr.error('Erro ao atualizar status da integração.');
          },
        });

        this.loading = false;
      },
      error: () => {
        this.toastr.error('Erro ao enviar captura facial.', 'Erro');
        this.loading = false;
      },
    });
  }

  getButtonState() {
    const url = this.router.url;

    // Case 1: Facial awaiting validation → hide all
    if (this.facialIntegrada === 'N' && this.integracaoOcorrencia === 'Aguardando Validação') {
      return { showSend: false, showRepeat: false, disabled: true };
    }

    // Case 2: Facial already validated → hides everything
    if (this.facialIntegrada === 'S') {
      return { showSend: false, showRepeat: false, disabled: true };
    }

    // Case 3: Occurrence has changed and user is **outside the capture page** → just repeat
    if (
      this.facialIntegrada === 'N' &&
      this.integracaoOcorrencia !== 'Aguardando Validação' &&
      !url.includes('FaceCapture')
    ) {
      return { showSend: false, showRepeat: true, disabled: false };
    }

    // Case 4: Capture page → show submit + repeat
    return { showSend: true, showRepeat: true, disabled: false };
  }

  repeatCapture() {
    if (this.imageSent) return;

    this.imagecaptured = null;
    this.homeCapture = false;
    this.startCapture();
  }

  async showImage() {
    const userId = this.auth.getUserInfo()?.id;
    if (!userId) return;

    const token = this.auth.getToken();
    if (!token) return;

    try {
      // Try to get it from the bank
      const data = await this.api.fetchFacialBase64(userId, token);
      const url = this.router.url;

      if (data.base64) {
        this.imagecaptured = data.base64;
        localStorage.setItem('imagecaptured', this.imagecaptured);

        // Search for the person's status in the bank
        const userId = this.person?.id || this.auth.getUserInfo()?.id;
        if (userId) {
          this.api.getPersonById(userId).subscribe({
            next: (res: any) => {
              this.facialIntegrada = res.facialIntegrada;
              this.integracaoOcorrencia = res.integracaoOcorrencia;

              // Update localStorage
              this.saveLocalStorage();

              // Blocks buttons if already integrated
              if (this.facialIntegrada === 'S' || this.facialIntegrada === 'N') {
                this.imageSent = true;
                this.showCamera = false;
              } else {
                this.imageSent = false;
              }

              this.homeCapture = false;
            },
            error: () => {
              this.imageSent = false;
            },
          });
        }
      }

      // If you didn't find it in the bank, check localStorage
      const storedImage = localStorage.getItem('imagecaptured');
      if (storedImage) {
        this.imagecaptured = storedImage;
        this.imageSent = false; // allows sending/recapturing
        this.homeCapture = false; // don't show start button
        this.showCamera = false;
        this.toastr.info(
          'Imagem carregada do armazenamento local. Você pode enviar para o banco ou recapturar.'
        );
        return;
      }

      // If you didn't find it anywhere → allow capture
      this.imagecaptured = null;
      this.imageSent = false;
      this.homeCapture = true;
      this.showCamera = false;

      // Only shows toast if not in the viewPerson route
      if (!url.includes('VisualizarPessoa')) {
        this.toastr.info('Facial liberada para cadastro.');
      }
    } catch {
      this.toastr.error('Falha ao carregar facial');
    }
  }

  private stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    this.videoRef.nativeElement.srcObject = null;
    this.showCamera = false;
  }

  private dataURLtoFile(dataurl: string, filename: string) {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }

  private saveLocalStorage() {
    if (this.imagecaptured) localStorage.setItem('imagecaptured', this.imagecaptured);
    if (this.facialIntegrada)
      localStorage.setItem('facialIntegrada', this.facialIntegrada.toString());
    if (this.integracaoOcorrencia)
      localStorage.setItem('integracaoOcorrencia', this.integracaoOcorrencia);
  }
}
