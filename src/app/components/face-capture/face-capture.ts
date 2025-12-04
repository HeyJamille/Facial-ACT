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
import { AuthService } from '../../services/auth-service/auth-service';
import { ApiService } from '../../services/api-service/api-service';
import * as faceapi from 'face-api.js';

@Component({
  selector: 'app-face-capture',
  templateUrl: './face-capture.html',
  standalone: true,
  imports: [CommonModule],
})
export class FaceCapture implements AfterViewInit {
  @ViewChild('video') videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('overlayCanvas') overlayCanvasRef!: ElementRef<HTMLCanvasElement>; // FACE-API

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

  private canvas!: HTMLCanvasElement; // Declaração da variável canvas
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
          this.facialIntegrada = res.facialIntegrada;
        },
        error: (err) => console.error('Erro ao buscar usuário:', err),
      });
    }
  }

  getButtonState() {
    if (this.facialIntegrada === '' && this.integracaoOcorrencia === '') {
      return { showSend: true, showRepeat: true, disabled: false };
    } else if (this.facialIntegrada === 'S') {
      return { showSend: false, showRepeat: false, disabled: true };
    } else if (
      this.facialIntegrada === 'N' &&
      this.integracaoOcorrencia === 'Aguardando Validação'
    ) {
      return { showSend: false, showRepeat: false, disabled: true };
    } else if (this.errorImagem === true) {
      return { showSend: true, showRepeat: true, disabled: false };
    } else {
      return { showSend: false, showRepeat: true, disabled: true };
    }
  }

  async showImage() {
    const url = this.router.url;
    const isViewingPerson = url.includes('VisualizarPessoa');

    const userId =
      this.person?.id ||
      (isViewingPerson && this.isAdmin ? this.person?.id : this.auth.getUserInfo()?.id);

    if (!userId) return;

    const token = this.auth.getToken();
    if (!token) return;

    try {
      const data = await this.api.fetchFacialBase64(userId, token);

      if (data?.base64) {
        this.imagecaptured = data.base64.startsWith('data:')
          ? data.base64
          : `data:image/jpeg;base64,${data.base64}`;

        this.api.getPersonById(userId).subscribe({
          next: (res: any) => {
            this.facialIntegrada = res.facialIntegrada;
            this.integracaoOcorrencia = res.integracaoOcorrencia;

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

  async ngOnInit(): Promise<void> {
    this.showImage();

    this.isAdmin = this.auth.getUserInfo()?.role === 'A';

    const url = this.router.url;

    if (url.includes('VisualizarPessoa')) {
      this.isViewMode = true;
    } else if (url.includes('EditarPessoa')) {
      this.isEditMode = true;
    }

    try {
      await faceapi.nets.tinyFaceDetector.loadFromUri('/face-models/');
    } catch (err) {
      console.error('Erro ao carregar modelos:', err);
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
        const video = this.videoRef.nativeElement;

        video.srcObject = stream;

        video.onloadedmetadata = () => {
          video.play();
          this.startFaceDetection(); // FACE-API
        };
      })
      .catch(() => this.toastr.error('Erro ao acessar a câmera.'));
  }

  async startFaceDetection() {
    const video = this.videoRef.nativeElement;
    const overlay = this.overlayCanvasRef.nativeElement;

    if (!video || !overlay) {
      console.error('VIDEO OU CANVAS NÃO ENCONTRADO');
      return;
    }

    // É necessário definir width e height após o vídeo carregar para pegar os valores corretos
    overlay.width = video.videoWidth;
    overlay.height = video.videoHeight;

    const ctx = overlay.getContext('2d');

    if (!ctx) {
      console.error('Contexto 2D não disponível no canvas.');
      return;
    }

    const drawFixedCircle = () => {
      const centerX = overlay.width / 2;
      const centerY = overlay.height / 2;
      const radius = 150;

      // Desenha o círculo fixo (guia)
      ctx.strokeStyle = 'lime';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
    };

    const loopDetection = async () => {
      ctx.clearRect(0, 0, overlay.width, overlay.height);
      drawFixedCircle();

      // 👇 CHAMA A FUNÇÃO QUE DETECTA E ATUALIZA A MENSAGEM
      await this.detectFace(ctx, video);

      // Precisa do ChangeDetectorRef para garantir que o Angular saiba que a variável mudou
      this.cd.detectChanges();

      requestAnimationFrame(loopDetection);
    };

    loopDetection();
  }

  async detectFace(ctx: CanvasRenderingContext2D, video: HTMLVideoElement) {
    try {
      const result = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions());

      // 1. SE ROSTO NÃO FOR DETECTADO:
      // A mensagem já está visível (controlada pelo showCamera no HTML).
      // Apenas desabilite o botão.
      if (!result) {
        // Não altere showFacePositionMessage
        return;
      }

      // 2. SE ROSTO FOI DETECTADO:
      // Desenha o círculo sobre o rosto
      const box = result.box;
      const radius = Math.max(box.width, box.height) / 2;
      const centerX = box.x + box.width / 2;
      const centerY = box.y + box.height / 2;

      ctx!.strokeStyle = 'lime';
      ctx!.lineWidth = 4;
      ctx!.beginPath();
      ctx!.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx!.stroke();

      // Verifica se o rosto está dentro do círculo fixo
      const faceIsInside = this.isFaceInsideCircle(box);

      // IMPORTANTE: Removida a linha this.showFacePositionMessage = !faceIsInside;
    } catch (e) {
      console.error('Erro na detecção:', e);
    }
  }

  // Função que verifica se o rosto está dentro do círculo fixo
  isFaceInsideCircle(box: faceapi.Box): boolean {
    const centerX = this.overlayCanvasRef.nativeElement.width / 2;
    const centerY = this.overlayCanvasRef.nativeElement.height / 2;
    const radius = 150;

    const faceCenterX = box.x + box.width / 2;
    const faceCenterY = box.y + box.height / 2;

    const distance = Math.sqrt(
      Math.pow(faceCenterX - centerX, 2) + Math.pow(faceCenterY - centerY, 2)
    );

    return distance < radius;
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
  }

  sendImage() {
    if (this.imageSent) return;

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

    this.facialIntegrada = 'N';
    this.integracaoOcorrencia = 'Aguardando Validação';
    this.imageSent = true;
    this.showCamera = false;
    this.homeCapture = false;

    this.api.uploadFacial(userId, formData).subscribe({
      next: () => {
        this.toastr.success('Captura facial enviada com sucesso!', 'Sucesso');
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

  repeatCapture() {
    this.showCamera = true;
    this.errorImagem = true;
    this.isEditMode = true;
    this.imagecaptured = null;
    this.auth.clearImageLocalStorage();
    this.imageSent = false;
    this.homeCapture = false;
    this.startCapture();
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
}
