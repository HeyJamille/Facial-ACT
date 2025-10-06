import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { AuthService } from '../../services/auth-service/auth-service';
import { ApiService } from '../../services/api-service/api-service';
import { ToastrService } from 'ngx-toastr';
import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Button } from '../ui/button/button';

@Component({
  selector: 'app-face-capture',
  templateUrl: './face-capture.html',
  standalone: true,
  imports: [CommonModule],
})
export class FaceCapture implements AfterViewInit {
  @ViewChild('video') videoRef!: ElementRef<HTMLVideoElement>;

  imagemCapturada: string | null = null;
  imagemSegura: SafeUrl | null = null;

  inicioCaptura: boolean = true;
  showCamera: boolean = false;
  isLoading: boolean = false;
  imagemJaEnviada: boolean = false; // <- novo estado
  loading: boolean = false;

  private canvas!: HTMLCanvasElement;
  private stream: MediaStream | null = null;

  constructor(
    private sanitizer: DomSanitizer,
    private auth: AuthService,
    private api: ApiService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.carregarImagem();
  }

  ngAfterViewInit(): void {
    this.canvas = document.createElement('canvas');
  }

  iniciarCaptura() {
    if (this.imagemJaEnviada) {
      this.toastr.info('Captura facial já cadastrada. Não é possível enviar outra.');
      return;
    }

    this.inicioCaptura = false;
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

  capturarImagem() {
    if (this.imagemJaEnviada) return;

    const video = this.videoRef.nativeElement;

    this.canvas.width = video.videoWidth;
    this.canvas.height = video.videoHeight;

    const ctx = this.canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);

    this.imagemCapturada = this.canvas.toDataURL('image/jpeg');

    this.stopCamera();

    localStorage.setItem('imagemCapturada', this.imagemCapturada);
  }

  enviarImagem() {
    if (this.imagemJaEnviada) {
      this.toastr.info('Captura facial já cadastrada. Não é possível enviar outra.');
      return;
    }

    if (!this.imagemCapturada) {
      this.toastr.warning('Nenhuma captura facial capturada.');
      return;
    }

    this.loading = true;

    const userId = this.auth.getUserInfo()?.id;
    if (!userId) {
      this.toastr.error('Usuário não encontrado.', 'Erro');
      this.loading = false;
      return;
    }

    const file = this.dataURLtoFile(this.imagemCapturada, 'facial.jpg');
    const formData = new FormData();
    formData.append('file', file);

    this.api.uploadFacial(userId, formData).subscribe({
      next: () => {
        this.toastr.success('Captura facial enviada com sucesso!', 'Sucesso');
        this.loading = false;
        this.imagemJaEnviada = true; // bloqueia novos envios
        this.showCamera = false;
      },
      error: () => {
        this.toastr.error('Erro ao enviar captura facial.', 'Erro');
        this.loading = false;
      },
    });
  }

  repetirCaptura() {
    if (this.imagemJaEnviada) return;

    this.imagemCapturada = null;
    this.inicioCaptura = false;
    this.iniciarCaptura();
  }

  async carregarImagem() {
    const userId = this.auth.getUserInfo()?.id;
    if (!userId) return;

    const token = this.auth.getToken();
    if (!token) return;

    try {
      // 1️⃣ Tenta buscar do banco
      const data = await this.api.fetchFacialBase64(userId, token);

      if (data.base64) {
        // Imagem do banco encontrada → bloqueia botões
        this.imagemCapturada = data.base64;
        localStorage.setItem('imagemCapturada', this.imagemCapturada);
        this.imagemJaEnviada = true; // bloqueia todos os botões
        this.inicioCaptura = false;
        this.showCamera = false;
        return;
      }

      // 2️⃣ Se não encontrou no banco, verifica localStorage
      const storedImage = localStorage.getItem('imagemCapturada');
      if (storedImage) {
        this.imagemCapturada = storedImage;
        this.imagemJaEnviada = false; // permite enviar/recapturar
        this.inicioCaptura = false; // não mostrar botão iniciar
        this.showCamera = false;
        this.toastr.info(
          'Imagem carregada do armazenamento local. Você pode enviar para o banco ou recapturar.'
        );
        return;
      }

      // 3️⃣ Se não encontrou em nenhum lugar → permite captura
      this.imagemCapturada = null;
      this.imagemJaEnviada = false;
      this.inicioCaptura = true;
      this.showCamera = false;
      this.toastr.info('Facial liberada para cadastro.');
    } catch {
      this.toastr.error('Falha ao carregar imagem');
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
}
