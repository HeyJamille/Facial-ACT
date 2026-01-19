import {
  Component,
  OnInit,
  OnDestroy,
  OnChanges,
  AfterViewInit,
  ViewChild,
  ElementRef,
  Input,
  Output,
  EventEmitter,
  SimpleChanges,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import * as faceapi from 'face-api.js';
import { interval, Subscription, startWith, switchMap, takeWhile } from 'rxjs';

import { AuthService } from '../../services/auth-service/auth-service';
import { ApiService } from '../../services/api-service/api-service';
import { Person } from '../../models/person.model';

@Component({
  selector: 'app-face-capture',
  templateUrl: './face-capture.html',
  standalone: true,
  imports: [CommonModule],
})
export class FaceCapture implements OnInit, OnChanges, OnDestroy, AfterViewInit {
  @ViewChild('video') videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('overlayCanvas') overlayCanvasRef!: ElementRef<HTMLCanvasElement>;

  @Input() isEditMode: boolean = false;
  @Input() person!: Person;
  @Input() showFaceCapture: boolean = false;
  @Output() showMessage = new EventEmitter<{ text: string; type: 'success' | 'error' }>();

  // Estados da UI
  imagecaptured: string | null = null;
  homeCapture: boolean = true;
  showCamera: boolean = false;
  imageSent: boolean = false;
  errorImagem: boolean = false;
  isAdmin = false;
  isViewMode = false;
  isDocumentsPage = false;

  // Status de Integração
  integracaoOcorrencia?: string;
  facialIntegrada?: string | number;

  private canvas!: HTMLCanvasElement;
  private stream: MediaStream | null = null;
  private pollingSub: Subscription | null = null; // Controle do RxJS

  constructor(
    private auth: AuthService,
    private api: ApiService,
    private toastr: ToastrService,
    private router: Router,
    private cd: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.isDocumentsPage = this.router.url.includes('/Documentos');
    this.isAdmin = this.auth.getUserInfo()?.role === 'A';

    const url = this.router.url;
    if (url.includes('VisualizarPessoa')) {
      this.isViewMode = true;
    } else if (url.includes('EditarPessoa')) {
      this.isEditMode = true;
    }

    this.loadModels();
    this.showImage();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['person'] && this.person?.id) {
      this.showImage();
      this.startPolling(); // Inicia o monitoramento se necessário
    }
  }

  ngOnDestroy(): void {
    this.stopPolling();
    this.stopCamera();
  }

  ngAfterViewInit(): void {
    this.canvas = document.createElement('canvas');
  }

  async loadModels() {
    try {
      await faceapi.nets.tinyFaceDetector.loadFromUri('/face-models/');
    } catch (err) {
      console.error('Erro ao carregar modelos face-api:', err);
    }
  }

  // --- LÓGICA DE POLLING ---

  startPolling() {
    // Se o status já for final (Aprovado ou Rejeitado), não inicia o polling
    if (this.person?.facialAprovada !== null && this.person?.facialAprovada !== undefined) {
      return;
    }

    this.stopPolling(); // Limpa assinatura anterior se existir

    this.pollingSub = interval(5000)
      .pipe(
        startWith(0),
        // Busca os dados atualizados da pessoa
        switchMap(() => this.api.getPersonById(this.person.id)),
        // Continua enquanto o status for nulo/indefinido. 'true' inclui o resultado que quebra a condição.
        takeWhile(
          (res: any) => res.facialAprovada === null || res.facialAprovada === undefined,
          true,
        ),
      )
      .subscribe({
        next: (res: any) => {
          this.person = res;
          this.facialIntegrada = res.facialIntegrada;
          this.integracaoOcorrencia = res.integracaoOcorrencia;
          this.cd.detectChanges();
        },
        error: (err) => console.error('Erro no polling de status:', err),
      });
  }

  private stopPolling() {
    if (this.pollingSub) {
      this.pollingSub.unsubscribe();
      this.pollingSub = null;
    }
  }

  async showImage() {
    const isViewingPerson = this.router.url.includes('VisualizarPessoa');
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
            this.person = res;
            this.facialIntegrada = res.facialIntegrada;
            this.integracaoOcorrencia = res.integracaoOcorrencia;
            this.imageSent = res.facialIntegrada === 'S' || res.facialIntegrada === 'N';
            this.homeCapture = false;
            this.startPolling(); // Inicia monitoramento após carregar dados iniciais
          },
        });
      } else {
        this.resetCaptureState();
      }
    } catch (err) {
      this.toastr.error('Falha ao carregar facial');
    }
  }

  private resetCaptureState() {
    this.imagecaptured = null;
    this.imageSent = false;
    this.homeCapture = true;
    this.showCamera = false;
  }

  getButtonState() {
    const p = this.person;

    // 1. SE JÁ FOI APROVADO MANUALMENTE (Fim de jogo)
    if (p.facialAprovada === true || this.facialIntegrada === 'S') {
      console.log('CASO 1 FACIAL');
      return {
        showSend: false,
        showRepeat: false,
        disabled: true,
        message: 'Aprovado',
        type: 'success',
      };
    }

    // 2. SE ESTÁ AGUARDANDO (Independente de ter sido reprovado antes)
    // Após o sendImage(), integracaoOcorrencia volta a ser 'Aguardando Validação'
    if (this.integracaoOcorrencia === 'Aguardando Validação') {
      console.log('CASO 2 FACIAL');
      return {
        showSend: false,
        showRepeat: false,
        disabled: true,
        message: 'Aguardando Validação',
        type: 'error',
      };
    }

    if (p.facialIntegrada === 'N' && this.person.integracaoOcorrencia !== null) {
      console.log('CASO 3 FACIAL');
      return {
        showSend: true,
        showRepeat: true,
        disabled: false,
        message: p.integracaoOcorrencia || 'Rejeitado',
        type: 'error',
      };
    }

    // 2. SE ESTÁ AGUARDANDO (Independente de ter sido reprovado antes)
    // Após o sendImage(), integracaoOcorrencia volta a ser 'Aguardando Validação'
    if (p.facialAprovada === false && this.person.motivoRejeicaoFacial !== null) {
      console.log('CASO 4 FACIAL');
      return {
        showSend: true,
        showRepeat: true,
        disabled: false,
        message: p.motivoRejeicaoFacial || 'Rejeitado',
        type: 'error',
      };
    }

    // 5. ERRO AUTOMÁTICO (Caso N e não seja "Aguardando")
    if (this.facialIntegrada === 'N' && this.integracaoOcorrencia) {
      console.log('CASO 5 FACIAL');
      return {
        showSend: true,
        showRepeat: true,
        disabled: false,
        message: this.integracaoOcorrencia,
        type: 'error',
      };
    }

    console.log('CASO 6 FACIAL');
    // CASO PADRÃO: Novo envio
    return { showSend: true, showRepeat: true, disabled: false, message: null, type: null };
  }

  // --- CÂMERA E CAPTURA ---

  startCapture() {
    if (this.imageSent) {
      this.toastr.info('Captura facial já cadastrada.');
      return;
    }
    this.homeCapture = false;
    this.showCamera = true;

    navigator.mediaDevices
      ?.getUserMedia({ video: true })
      .then((stream) => {
        this.stream = stream;
        this.videoRef.nativeElement.srcObject = stream;
        this.videoRef.nativeElement.onloadedmetadata = () => {
          this.videoRef.nativeElement.play();
          this.startFaceDetection();
        };
      })
      .catch(() => this.toastr.error('Erro ao acessar a câmera.'));
  }

  async startFaceDetection() {
    const video = this.videoRef.nativeElement;
    const overlay = this.overlayCanvasRef.nativeElement;
    if (!video || !overlay) return;

    overlay.width = video.videoWidth;
    overlay.height = video.videoHeight;
    const ctx = overlay.getContext('2d');

    const loop = async () => {
      if (!this.showCamera) return;
      ctx?.clearRect(0, 0, overlay.width, overlay.height);
      this.drawGuide(ctx!, overlay.width, overlay.height);
      await this.detectFace(ctx!, video);
      this.cd.detectChanges();
      requestAnimationFrame(loop);
    };
    loop();
  }

  drawGuide(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.strokeStyle = 'lime';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 150, 0, Math.PI * 2);
    ctx.stroke();
  }

  async detectFace(ctx: CanvasRenderingContext2D, video: HTMLVideoElement) {
    const result = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions());
    if (result) {
      const { x, y, width, height } = result.box;
      ctx.strokeStyle = 'blue';
      ctx.beginPath();
      ctx.arc(x + width / 2, y + height / 2, Math.max(width, height) / 2, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  captureImage() {
    const video = this.videoRef.nativeElement;
    this.canvas.width = video.videoWidth;
    this.canvas.height = video.videoHeight;
    this.canvas.getContext('2d')?.drawImage(video, 0, 0);
    this.imagecaptured = this.canvas.toDataURL('image/jpeg');
    this.stopCamera();
  }

  sendImage() {
    if (!this.imagecaptured || this.imageSent) return;

    const userId = this.person?.id || this.auth.getUserInfo()?.id;
    const file = this.dataURLtoFile(this.imagecaptured, 'facial.jpg');
    const formData = new FormData();
    formData.append('file', file);

    this.api.uploadFacial(userId, formData).subscribe({
      next: () => {
        this.toastr.success('Captura facial enviada!');

        this.person.facialAprovada = null;
        this.person.motivoRejeicaoFacial = '';

        this.api
          .updateIntegration(userId, {
            facialIntegrada: 'N',
            integracaoOcorrencia: 'Aguardando Validação',
          })
          .subscribe(() => {
            this.imageSent = true;
            this.facialIntegrada = 'N';
            this.integracaoOcorrencia = 'Aguardando Validação';
            this.startPolling(); // Começa a vigiar a resposta do backend
          });
      },
      error: () => this.toastr.error('Erro ao enviar.'),
    });
  }

  repeatCapture() {
    this.imagecaptured = null;
    this.imageSent = false;
    this.errorImagem = true;
    this.startCapture();
  }

  private stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    this.showCamera = false;
  }

  private dataURLtoFile(dataurl: string, filename: string) {
    const arr = dataurl.split(','),
      mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length,
      u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  }
}
