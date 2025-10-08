import { SafeUrl } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

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

  private canvas!: HTMLCanvasElement;
  private stream: MediaStream | null = null;

  constructor(private auth: AuthService, private api: ApiService, private toastr: ToastrService) {}

  ngOnInit(): void {
    this.showImage();
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

    const userId = this.auth.getUserInfo()?.id;
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
        this.loading = false;
        this.imageSent = true; // block new sends
        this.showCamera = false;
      },
      error: () => {
        this.toastr.error('Erro ao enviar captura facial.', 'Erro');
        this.loading = false;
      },
    });
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

      if (data.base64) {
        // Stock image found, lock buttons
        this.imagecaptured = data.base64;
        localStorage.setItem('imagecaptured', this.imagecaptured);
        this.imageSent = true; // locks all buttons
        this.homeCapture = false;
        this.showCamera = false;
        return;
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
      this.toastr.info('Facial liberada para cadastro.');
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
}
