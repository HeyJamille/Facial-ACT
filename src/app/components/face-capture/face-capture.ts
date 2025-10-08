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
  imageQuality: 'boa' | 'escura' | 'clara' | null = null;

  integracaoOcorrencia?: string;
  facialIntegrada?: string | number;

  private canvas!: HTMLCanvasElement;
  private stream: MediaStream | null = null;

  constructor(private auth: AuthService, private api: ApiService, private toastr: ToastrService) {}

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

  isButtonBlocked(): boolean {
    // Se a facial já foi integrada com sucesso, bloqueia
    if (this.facialIntegrada === 'S') return true;

    // Qualquer outro caso, libera o botão
    return false;
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

    this.checkImageBrightness(this.imagecaptured).then((result: 'boa' | 'escura' | 'clara') => {
      this.imageQuality = result;
      let facialValue: string | number;
      let integracaoMensagem: string;

      if (result === 'boa') {
        // Good Photo
        facialValue = 'S';
        integracaoMensagem = 'Rosto integrado com sucesso.';
      } else {
        // Foto ruim → pega valor atual da API
        facialValue = this.facialIntegrada || 'N';

        // Se for 'N', mostra "Aguardando Avaliação"
        if (facialValue === 'N') {
          integracaoMensagem = 'Aguardando Avaliação';
        } else {
          // Caso seja número ou outro valor, usa a mensagem retornada da API
          integracaoMensagem = this.integracaoOcorrencia || 'Erro na captura';
        }
      }

      // ✅ Aqui você confere o valor
      console.log('Facial Integrada:', facialValue, 'Integracao Ocorrencia:', integracaoMensagem);

      const payload = {
        facialIntegrada: facialValue,
        integracaoOcorrencia: integracaoMensagem,
      };

      this.api.updateIntegration(this.person.id, payload).subscribe({
        next: (res: any) => {
          this.facialIntegrada = payload.facialIntegrada;
          this.integracaoOcorrencia = payload.integracaoOcorrencia;
        },
        error: (err) => console.error('Erro ao atualizar integração', err),
      });
    });
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

  checkImageBrightness(imageDataUrl: string): Promise<'boa' | 'escura' | 'clara'> {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = imageDataUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve('boa');

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);

        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const data = imageData.data;

        let brightnessSum = 0;
        const totalPixels = data.length / 4;

        for (let i = 0; i < data.length; i += 4) {
          // Média do brilho de cada pixel (RGB)
          const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
          brightnessSum += brightness;
        }

        const avgBrightness = brightnessSum / totalPixels;

        // Define faixas de luminosidade
        if (avgBrightness < 60) {
          resolve('escura');
        } else if (avgBrightness > 200) {
          resolve('clara');
        } else {
          resolve('boa');
        }
      };
    });
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
        this.imagecaptured = data.base64;
        localStorage.setItem('imagecaptured', this.imagecaptured);

        // Bloqueia apenas se for 'S'
        if (this.facialIntegrada === 'S') {
          this.imageSent = true; // bloqueia enviar/recapturar
          this.showCamera = false;
        } else {
          this.imageSent = false; // permite recapturar
          this.showCamera = false;
        }

        this.homeCapture = false;
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
