import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api-service/api-service';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../services/auth-service/auth-service';

@Component({
  selector: 'app-face-capture',
  templateUrl: './face-capture.html',
  imports: [CommonModule, FormsModule],
})
export class FaceCapture implements AfterViewInit {
  @ViewChild('video') videoRef!: ElementRef<HTMLVideoElement>;

  imagemCapturada: string | null = null;

  // State control
  inicioCaptura: boolean = true;
  showCamera: boolean = false;

  private canvas!: HTMLCanvasElement;

  constructor(
    private http: HttpClient,
    private router: Router,
    private api: ApiService,
    private toastr: ToastrService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    // Recupera a imagem do localStorage, se existir
    const imagemSalva = localStorage.getItem('imagemCapturada');
    if (imagemSalva) {
      this.imagemCapturada = imagemSalva;
      this.showCamera = false; // Esconde a câmera se já tiver imagem
      this.inicioCaptura = false;
    }
  }

  ngAfterViewInit(): void {
    this.canvas = document.createElement('canvas');
  }

  iniciarCaptura() {
    this.inicioCaptura = false;
    this.showCamera = true;
    this.iniciarCamera();
  }

  iniciarCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.toastr.warning('Câmera não suportada neste navegador.');
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => (this.videoRef.nativeElement.srcObject = stream))
      .catch((err) => this.toastr.error('Erro ao acessar a câmera: '));
  }

  capturarImagem() {
    const video = this.videoRef.nativeElement;
    this.showCamera = false;

    this.canvas.width = video.videoWidth;
    this.canvas.height = video.videoHeight;
    const ctx = this.canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);

    this.imagemCapturada = this.canvas.toDataURL('image/jpeg');

    // Save in localStorage
    localStorage.setItem('imagemCapturada', this.imagemCapturada);
  }

  enviarImagem() {
    if (!this.imagemCapturada) return;

    const file = this.dataURLtoFile(this.imagemCapturada, 'facial.jpg');
    const formData = new FormData();
    formData.append('file', file); // envia como arquivo

    // Pega o ID do usuário direto do AuthService
    const userInfo = this.auth.getUserInfo();
    const userId = userInfo?.id;

    if (!userId) {
      this.toastr.error('Usuário não encontrado.', 'Erro');
      return;
    }

    // Envia a foto usando o ID
    this.api.uploadFacial(userId, formData).subscribe({
      next: () => {
        this.toastr.success('Captura facial enviada com sucesso!', 'Sucesso');
        this.repetirCaptura();
      },
      error: (err) => {
        //console.error('Erro ao enviar imagem:', err);
        this.toastr.error('Erro ao enviar a captura facial', 'Erro');
      },
    });
  }

  // Função utilitária
  private dataURLtoFile(dataUrl: string, filename: string): File {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  }

  repetirCaptura() {
    this.imagemCapturada = null;
    this.showCamera = true;
    this.iniciarCamera();
  }
}
