// Bibliotecas
import { ToastrService } from 'ngx-toastr';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
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
  @Output() showMessage = new EventEmitter<{ text: string; type: 'success' | 'error' }>();

  imagecaptured: string | null = null;
  homeCapture: boolean = true;
  showCamera: boolean = false;
  imageSent: boolean = false;
  errorImagem: boolean = false;

  integracaoOcorrencia?: string;
  facialIntegrada?: string | number;

  isAdmin = false;
  isViewMode = false;

  private canvas!: HTMLCanvasElement;
  private stream: MediaStream | null = null;

  constructor(
    private auth: AuthService,
    private api: ApiService,
    private toastr: ToastrService,
    private router: Router,
    private cd: ChangeDetectorRef
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

    const url = this.router.url;

    if (url.includes('VisualizarPessoa')) {
      this.isViewMode = true;
    } else if (url.includes('EditarPessoa')) {
      this.isEditMode = true;
    } else if (url.includes('RegistrarPessoa')) {
      this.isEditMode = false;
    }
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

  // capture and put in localStorage
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
      //this.toastr.info('Captura facial já cadastrada. Não é possível enviar outra.');
      return;
    }

    if (!this.imagecaptured) {
      this.toastr.warning('Nenhuma captura facial capturada.');
      return;
    }

    const userId = this.person?.id || this.auth.getUserInfo()?.id;
    if (!userId) {
      this.toastr.error('Usuário não encontrado.', 'Erro');
      return;
    }

    const file = this.dataURLtoFile(this.imagecaptured, 'facial.jpg');
    const formData = new FormData();
    formData.append('file', file);

    // Updates status immediately before sending
    this.facialIntegrada = 'N';
    this.integracaoOcorrencia = 'Aguardando Validação';
    this.imageSent = true;
    this.showCamera = false;
    this.homeCapture = false;
    this.saveLocalStorage();

    this.api.uploadFacial(userId, formData).subscribe({
      next: () => {
        this.toastr.success('Captura facial enviada com sucesso!', 'Sucesso');

        // Update api
        this.api
          .updateIntegration(userId, {
            facialIntegrada: this.facialIntegrada,
            integracaoOcorrencia: this.integracaoOcorrencia,
          })
          .subscribe({
            next: () => {},
            error: () => this.toastr.error('Erro ao atualizar status da integração.'),
          });
      },
      error: () => {
        this.toastr.error('Erro ao enviar captura facial.', 'Erro');
      },
    });
  }

  getButtonState() {
    // Case 1: Facial awaiting validation → hide all
    if (this.facialIntegrada === '' && this.integracaoOcorrencia === '') {
      //console.log('CASO 1');
      return { showSend: true, showRepeat: true, disabled: false };
    } else if (this.facialIntegrada === 'S') {
      //console.log('CASO 2');
      return { showSend: false, showRepeat: false, disabled: true };
    } else if (
      this.facialIntegrada === 'N' &&
      this.integracaoOcorrencia === 'Aguardando Validação'
    ) {
      //console.log('CASO 3');
      return { showSend: false, showRepeat: false, disabled: true };
    } else if (this.errorImagem === true) {
      return { showSend: true, showRepeat: true, disabled: false };
    } else {
      //console.log('CASO 4');
      return { showSend: false, showRepeat: true, disabled: true };
    }
  }

  repeatCapture() {
    //if (this.imageSent) return;

    this.showCamera = true;
    this.errorImagem = true;
    this.isEditMode = true;
    //console.log('Dados', this.isEditMode);
    this.imagecaptured = null;
    this.auth.clearImageLocalStorage();
    this.imageSent = false;
    this.homeCapture = false;
    this.startCapture();
  }

  async showImage() {
    const url = this.router.url;

    // Verifica se está na rota de VisualizarPessoa
    const isViewingPerson = url.toLowerCase().includes('visualizarpessoa');

    // ⚠️ Sempre prioriza o this.person.id se existir
    const userId =
      this.person?.id ||
      (isViewingPerson && this.isAdmin ? this.person?.id : this.auth.getUserInfo()?.id);
    console.log('ID usado para buscar imagem:', userId);

    if (!userId) {
      console.warn('Nenhum ID de pessoa encontrado.');
      return;
    }

    const token = this.auth.getToken();
    if (!token) {
      console.warn('Token não encontrado.');
      return;
    }

    try {
      // Busca imagem pelo ID da pessoa
      const data = await this.api.fetchFacialBase64(userId, token);
      console.log('Retorno da API:', data);

      if (data?.base64) {
        // Monta base64 corretamente
        this.imagecaptured = data.base64.startsWith('data:')
          ? data.base64
          : `data:image/jpeg;base64,${data.base64}`;

        // Se quiser armazenar localmente:
        // localStorage.setItem('imagecaptured', this.imagecaptured);

        // Busca informações da pessoa
        this.api.getPersonById(userId).subscribe({
          next: (res: any) => {
            this.facialIntegrada = res.facialIntegrada;
            this.integracaoOcorrencia = res.integracaoOcorrencia;
            this.saveLocalStorage();

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
      } else {
        // Caso não tenha imagem, tenta localStorage
        const storedImage = localStorage.getItem('imagecaptured');
        if (storedImage) {
          this.imagecaptured = storedImage;
          this.imageSent = false;
          this.homeCapture = false;
          this.showCamera = false;
          return;
        }

        // Nenhuma imagem → libera captura
        this.imagecaptured = null;
        this.imageSent = false;
        this.homeCapture = true;
        this.showCamera = false;

        if (!isViewingPerson && !this.isAdmin) {
          this.showMessage.emit({
            text: 'Facial liberada para cadastro',
            type: 'success',
          });
        }
      }
    } catch (err) {
      console.error('Erro ao buscar imagem facial:', err);
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
