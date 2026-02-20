import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from '../../services/api-service/api-service';
import { AuthService } from '../../services/auth-service/auth-service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Button } from '../ui/button/button';
import { Person } from '../../models/person.model';
import { SafeUrlPipe } from '../../services/safeUrlPipe';
import { forkJoin } from 'rxjs';
import { concat } from 'rxjs'; // Certifique-se de importar o concat

@Component({
  selector: 'app-card-upload',
  templateUrl: './card-upload.html',
  imports: [CommonModule, FormsModule, Button, SafeUrlPipe],
})
export class CardUpload implements OnInit, OnChanges, OnDestroy {
  @Output() cardSelected = new EventEmitter<File>();
  @Output() uploadMessage = new EventEmitter<{ text: string; type: 'success' | 'error' }>();
  @Input() person!: Person;
  @Input() isEditMode = false;

  //fileToUpload?: File;

  fileFrenteToUpload?: File;
  fileVersoToUpload?: File;

  arquivoUrlFrente: string = '';
  arquivoUrlVerso: string = '';

  imagePreviewFrente: string | null = null;
  imagePreviewVerso: string | null = null;
  imagePreviewPDF: string | null = null;

  pdfPreviewUrl: string | null = null; // URL do PDF

  isPdf = false;
  fileUploaded = false;

  isAdmin = false;
  isViewMode = false;

  isDeleting = false;
  cardDeleted = false;
  isDocumentsPage = false;

  arquivoUrlCarteirinha: string = '';
  arquivoCarteirinhaOriginal?: string;

  isLoading = true;

  private statusInterval: any;

  constructor(
    private toastr: ToastrService,
    private api: ApiService,
    private auth: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.isDocumentsPage = this.router.url.includes('/Documentos');
    this.isViewMode = this.router.url.includes('/VisualizarDados');

    const token = this.auth.getToken();

    //console.log('this.person', this.person.UsuarioID);
    //console.log('token', token);

    //UsuarioID
    if (this.person.id && token) {
      this.showDocument(this.person.id, token, 'carteirinha');
    }

    this.startStatusPolling();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['person'] && this.person) {
      this.checkDocument();
    }
  }

  ngOnDestroy() {
    if (this.statusInterval) {
      clearInterval(this.statusInterval);
    }

    if (this.arquivoUrlCarteirinha) {
      URL.revokeObjectURL(this.arquivoUrlCarteirinha);
    }
  }

  private startStatusPolling() {
    this.statusInterval = setInterval(() => {
      if (this.person?.id) {
        this.api.getApproveByCPF(this.person).subscribe({
          next: (response) => {
            if (
              this.person.statusCarteirinha !== response.statusCarteirinha ||
              this.person.motivoRejeicaoCarteirinha !== response.motivoRejeicaoCarteirinha
            ) {
              this.person.statusCarteirinha = response.statusCarteirinha;
              this.person.motivoRejeicaoCarteirinha = response.motivoRejeicaoCarteirinha;
            }
            this.isLoading = false;
          },
          error: (err) => {
            (console.error('Erro ao consultar pessoa', this.person.id, err),
              (this.isLoading = false));
          },
        });
      }
    }, 5000); // 5 segundos
  }

  private checkDocument() {
    this.api.getPersonById(this.person.id).subscribe({
      next: (res: any) => {
        if (res?.arquivoCarteirinha) {
          this.fileUploaded = true;
          this.isEditMode = false;
          this.arquivoCarteirinhaOriginal = res.arquivoCarteirinha;
        } else {
          this.isEditMode = true;
          this.fileUploaded = false;
          if (!this.router.url.includes('VisualizarPessoa') && !this.isAdmin) {
            this.uploadMessage.emit({
              text: 'Carteirinha liberada para cadastro',
              type: 'success',
            });
          }
        }
      },
      error: () => {
        this.isEditMode = true;
        this.fileUploaded = false;
      },
    });
  }

  showDocument(personId: string, token: string, tipoArquivo: 'carteirinha' | 'documento') {
    // 1. Primeiro buscamos sempre a frente
    this.api.downloadFile(personId, token, tipoArquivo, false).subscribe({
      next: (blobFrente: Blob) => {
        if (!blobFrente || blobFrente.size === 0) return;

        // 2. Verifica se é PDF
        this.isPdf = blobFrente.type === 'application/pdf';

        // 3. Processa a URL da Frente
        if (this.arquivoUrlFrente) URL.revokeObjectURL(this.arquivoUrlFrente);
        this.arquivoUrlFrente = URL.createObjectURL(blobFrente);
        this.imagePreviewFrente = this.arquivoUrlFrente;

        // Se for PDF, paramos aqui e usamos a URL da frente para o iframe
        if (this.isPdf) {
          this.arquivoUrlCarteirinha = this.arquivoUrlFrente;
          this.fileUploaded = true;
        }
        // 4. Se NÃO for PDF, busca o verso
        else {
          this.api.downloadFile(personId, token, tipoArquivo, true).subscribe({
            next: (blobVerso: Blob) => {
              if (blobVerso && blobVerso.size > 0) {
                if (this.arquivoUrlVerso) URL.revokeObjectURL(this.arquivoUrlVerso);
                this.arquivoUrlVerso = URL.createObjectURL(blobVerso);
                this.imagePreviewVerso = this.arquivoUrlVerso;
              }
              this.fileUploaded = true;
            },
            error: (err) => console.error('Verso não encontrado ou erro:', err),
          });
        }
      },
      error: (err) => console.error('Erro ao carregar frente:', err),
    });
  }

  onFileSelected(event: any, lado: 'frente' | 'verso'): void {
    const file = event.target.files[0];
    if (!file) return;

    this.cardSelected.emit(file);

    // Verifica se o arquivo é PDF
    if (file.type === 'application/pdf') {
      //console.log('é pdf');
      this.isPdf = true;
      this.imagePreviewPDF = URL.createObjectURL(file); // Cria preview do PDF
      this.fileFrenteToUpload = file; // No caso de PDF, geralmente enviamos como 'frente'
      return;
    }

    this.isPdf = false;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (lado === 'frente') {
        this.imagePreviewFrente = e.target?.result as string;
        this.fileFrenteToUpload = file; // Salva o arquivo da frente
      } else {
        this.imagePreviewVerso = e.target?.result as string;
        this.fileVersoToUpload = file; // Salva o arquivo do verso
      }
    };
    reader.readAsDataURL(file);
  }

  handlePreview(file: File) {
    //console.log('Arquivo selecionado:', file);

    if (file.type === 'application/pdf') {
      // Caso seja PDF
      this.isPdf = true;
      this.imagePreviewPDF = null; // Limpa a preview de imagem
      this.pdfPreviewUrl = URL.createObjectURL(file); // Gera uma URL do PDF

      // Mostra a mensagem de erro, se o PDF não for aceito
      this.toastr.error('PDF não é aceito. Por favor, envie uma imagem.', 'Erro de Upload');
    } else if (file.type.startsWith('image/')) {
      // Caso seja uma imagem
      this.isPdf = false;
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreviewVerso = reader.result as string;
        this.imagePreviewFrente = reader.result as string;
        //console.log('Imagem preview gerada:', this.imagePreview);
      };
      reader.readAsDataURL(file); // Gera a URL da imagem
    } else {
      // Caso seja um tipo de arquivo não permitido
      this.toastr.error('Tipo de arquivo não permitido. Envie apenas imagens.', 'Erro de Upload');
    }
  }

  sendImage() {
    if (!this.fileFrenteToUpload || !this.person) {
      this.toastr.warning('Selecione a frente da carteirinha.');
      return;
    }

    if (!this.isPdf && !this.fileVersoToUpload) {
      this.toastr.warning('Para imagens, é obrigatório selecionar a frente e o verso.');
      return;
    }

    // Preparamos os Observables
    const uploadFrente$ = this.api.uploadFile(
      this.person.id,
      'carteirinha',
      this.fileFrenteToUpload,
      false,
    );
    const uploadVerso$ = !this.isPdf
      ? this.api.uploadFile(this.person.id, 'carteirinha', this.fileVersoToUpload!, true)
      : null;

    // Se for PDF, envia um. Se imagem, envia um DEPOIS o outro.
    const uploadFlow$ = this.isPdf ? uploadFrente$ : concat(uploadFrente$, uploadVerso$!);

    uploadFlow$.subscribe({
      next: (res) => {
        // O next será chamado para cada arquivo enviado
        console.log('Arquivo enviado com sucesso:', res);
      },
      error: (err) => {
        console.error('Erro no upload:', err);
        this.toastr.error('Erro ao realizar upload.');
      },
      complete: () => {
        // O complete só roda quando TODOS do concat terminarem
        this.toastr.success(
          this.isPdf ? 'Carteirinha em PDF enviado!' : 'Carteirinha Frente e Verso enviados!',
        );
        this.fileUploaded = true;
        this.isEditMode = false;

        const token = this.auth.getToken();
        if (token && this.person.id) {
          this.showDocument(this.person.id, token, 'carteirinha');
        }
      },
    });
  }

  resetUpload() {
    this.fileUploaded = false;
    this.isEditMode = true;
    this.isPdf = false; // Resetar o estado de PDF

    // Importante: Revogar URLs para liberar memória
    if (this.imagePreviewPDF) {
      URL.revokeObjectURL(this.imagePreviewPDF);
      this.imagePreviewPDF = null;
    }

    if (this.arquivoUrlCarteirinha) {
      URL.revokeObjectURL(this.arquivoUrlCarteirinha);
      this.arquivoUrlCarteirinha = '';
    }

    this.imagePreviewVerso = '';
    this.imagePreviewFrente = '';
    this.fileFrenteToUpload = undefined;
    this.fileVersoToUpload = undefined;
  }

  deleteDocument() {
    this.isDeleting = true;
    this.api
      .deleteDocument(this.person.id, { facial: false, documento: false, carteirinha: true })
      .subscribe({
        next: () => {
          //console.log('Carteirinha deletada com sucesso!');
          this.resetUpload();
          this.isDeleting = false;
        },
        error: (err) => {
          const backendMessage =
            err?.error?.message ||
            JSON.stringify(err?.error) ||
            'Erro desconhecido, contate o suporte.';

          //this.toastr.error(backendMessage), console.log(backendMessage);
          this.isDeleting = false;
        },
      });
  }

  getButtonState() {
    if (
      this.isDocumentsPage &&
      this.person.statusCarteirinha === 'Carteirinha Não enviado(a)' &&
      this.person.arquivoCarteirinha === null
    ) {
      return {
        showSend: true,
        showRepeat: false,
        showDelete: false,
        disabled: true,
      };
    }

    if (
      this.isViewMode &&
      this.person.statusCarteirinha === 'Carteirinha Não enviado(a)' &&
      this.person.arquivoCarteirinha === null
    ) {
      return {
        showSend: false,
        showRepeat: false,
        showDelete: false,
        disabled: true,
      };
    }

    if (
      this.person.statusCarteirinha === 'Carteirinha Não enviado(a)' &&
      this.person.arquivoCarteirinha === null
    ) {
      //console.log('CASO 1');
      return { showSend: true, showRepeat: true, showDelete: false, disabled: false };
    }

    if (
      this.person.statusCarteirinha === 'Carteirinha Aprovada' &&
      this.person.arquivoCarteirinha !== null
    ) {
      //console.log('CASO 2');
      return { showSend: false, showRepeat: false, showDelete: false, disabled: true };
    }

    if (
      this.person.statusCarteirinha === 'Carteirinha Pendente' &&
      this.person.arquivoCarteirinha !== null
    ) {
      //console.log('CASO 3');
      return { showSend: false, showRepeat: false, showDelete: false, disabled: true };
    }

    if (this.fileUploaded === true && this.person.statusCarteirinha !== 'Carteirinha Rejeitada') {
      //console.log('CASO 4');
      return { showSend: false, showRepeat: false, showDelete: false, disabled: true };
    }

    if (
      this.person.statusCarteirinha === 'Carteirinha Rejeitada' &&
      this.person.arquivoCarteirinha !== null &&
      this.person.motivoRejeicaoCarteirinha !== null
    ) {
      //console.log('CASO 5');
      return {
        showSend: false,
        showRepeat: false,
        showDelete: true,
        disabled: false,
      };
    }

    //console.log('CASO 6');
    return {
      showSend: true,
      showRepeat: true,
      showDelete: false,
      disabled: false,
    };
  }
}
