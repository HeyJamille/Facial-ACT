import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit,
  Output,
  EventEmitter,
} from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { AuthService } from '../../services/auth-service/auth-service';
import { ApiService } from '../../services/api-service/api-service';
import { ToastrService } from 'ngx-toastr';
import { NgModel } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-face-capture',
  templateUrl: './face-capture.html',
  imports: [CommonModule],
})
export class FaceCapture implements AfterViewInit {
  @ViewChild('video') videoRef!: ElementRef<HTMLVideoElement>;
  imagemCapturada: string | null = null;
  imagemSegura: SafeUrl | null = null;

  inicioCaptura: boolean = true;
  showCamera: boolean = false;

  private canvas!: HTMLCanvasElement;

  constructor(
    private sanitizer: DomSanitizer,
    private auth: AuthService,
    private api: ApiService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    //console.log('FaceCapture iniciado');
    this.carregarImagem();
  }

  ngAfterViewInit(): void {
    this.canvas = document.createElement('canvas');
  }

  iniciarCaptura() {
    this.inicioCaptura = false;
    this.showCamera = true;

    if (!navigator.mediaDevices?.getUserMedia) {
      this.toastr.warning('Câmera não suportada neste navegador.');
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => (this.videoRef.nativeElement.srcObject = stream))
      .catch(() => this.toastr.error('Erro ao acessar a câmera.'));
  }

  // Função utilitária para converter base64 em File
  capturarImagem() {
    const video = this.videoRef.nativeElement;
    this.showCamera = false;

    // Captura a imagem
    this.canvas.width = video.videoWidth;
    this.canvas.height = video.videoHeight;
    const ctx = this.canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);

    this.imagemCapturada = this.canvas.toDataURL('image/jpeg');

    // Para a câmera
    const stream = video.srcObject as MediaStream;
    stream.getTracks().forEach((track) => track.stop());
    video.srcObject = null;

    // Salva no localStorage
    localStorage.setItem('imagemCapturada', this.imagemCapturada);

    // ✅ Recupera o ID do usuário
    const userId = this.auth.getUserInfo()?.id;
    if (!userId) {
      this.toastr.error('Usuário não encontrado.', 'Erro');
      return;
    }

    // ✅ Converte a base64 em File
    const file = this.dataURLtoFile(this.imagemCapturada, 'facial.jpg');

    // ✅ Coloca no FormData
    const formData = new FormData();
    formData.append('file', file);

    // ✅ Chama API passando ID e FormData
    this.api.uploadFacial(userId, formData).subscribe({
      next: () => this.toastr.success('Imagem enviada com sucesso!', 'Sucesso'),
      error: () => this.toastr.error('Erro ao enviar imagem.', 'Erro'),
    });
  }

  // ✅ Carrega imagem da API ou do localStorage
  async carregarImagem() {
    //console.log('Carregando imagem (AJAX via ApiService)...');

    const userId = this.auth.getUserInfo()?.id;
    if (!userId) {
      this.toastr.error('Usuário não encontrado');
      return;
    }

    const token = this.auth.getToken();
    //console.log('Token:', token);
    if (!token) {
      // console.log('Token não encontrado');
      return;
    }

    try {
      const data = await this.api.fetchFacialBase64(userId, token);
      //console.log('Base64 retornado da API:', data);

      if (data.base64) {
        this.imagemCapturada = data.base64; // já vem pronto para <img src="">
        localStorage.setItem('imagemCapturada', this.imagemCapturada);
        this.showCamera = false;
      } else {
        this.toastr.warning('Nenhuma imagem facial encontrada na API.');
      }
    } catch (err) {
      //console.error('Erro ao carregar imagem:', err);
      this.toastr.error('Falha ao carregar imagem');
    }
  }

  // Função utilitária para converter base64 em File
  dataURLtoFile(dataurl: string, filename: string) {
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
