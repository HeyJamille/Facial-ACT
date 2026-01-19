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

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.html',
  imports: [CommonModule, FormsModule, Button, SafeUrlPipe],
})
export class FileUpload implements OnInit, OnChanges, OnDestroy {
  @Output() documentSelected = new EventEmitter<File>();
  @Output() uploadMessage = new EventEmitter<{ text: string; type: 'success' | 'error' }>();
  @Input() person!: Person;
  @Input() isEditMode = false;

  fileToUpload?: File;
  imagePreview: string | null = null;
  pdfPreviewUrl: string | null = null; // URL do PDF

  isPdf = false;
  fileUploaded = false;

  isAdmin = false;
  isViewMode = false;

  isDeleting = false;
  fileDeleted = false;
  isDocumentsPage = false;

  arquivoUrlDocumento: string = '';
  arquivoDocumentoOriginal?: string;

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

    console.log('this.person', this.person.UsuarioID);
    console.log('token', token);

    //UsuarioID
    if (this.person.id && token) {
      this.showDocument(this.person.id, token, 'documento');
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

    if (this.arquivoUrlDocumento) {
      URL.revokeObjectURL(this.arquivoUrlDocumento);
    }
  }

  private startStatusPolling() {
    this.statusInterval = setInterval(() => {
      if (this.person?.id) {
        this.api.getApproveByCPF(this.person).subscribe({
          next: (response) => {
            if (
              this.person.statusDocumento !== response.statusDocumento ||
              this.person.motivoRejeicaoDocumento !== response.motivoRejeicaoDocumento
            ) {
              this.person.statusDocumento = response.statusDocumento;
              this.person.motivoRejeicaoDocumento = response.motivoRejeicaoDocumento;
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
        if (res?.arquivoDocumento) {
          this.fileUploaded = true;
          this.isEditMode = false;
          this.arquivoDocumentoOriginal = res.arquivoDocumento;
        } else {
          this.isEditMode = true;
          this.fileUploaded = false;
          if (!this.router.url.includes('VisualizarPessoa') && !this.isAdmin) {
            this.uploadMessage.emit({
              text: 'Documento liberado para cadastro',
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
    this.api.downloadFile(personId, token, tipoArquivo).subscribe({
      next: (blob: Blob) => {
        if (!blob) {
          this.toastr.warning('Nenhum documento encontrado.');
          return;
        }

        // Verifica se é PDF
        this.isPdf = blob.type === 'application/pdf';

        // Revoga URL anterior para evitar memory leak
        if (this.arquivoUrlDocumento) {
          URL.revokeObjectURL(this.arquivoUrlDocumento);
        }

        // Cria URL do blob
        this.arquivoUrlDocumento = URL.createObjectURL(blob);

        // Para imagens, atualiza preview SEMPRE (substitui o preview local)
        if (!this.isPdf) {
          this.imagePreview = this.arquivoUrlDocumento;
        }

        this.fileUploaded = true;
      },
      error: (err) => {
        // Se der erro e não houver arquivoUrlDocumento, mantém o imagePreview
        console.error('Erro ao carregar documento:', err);

        /* Só mostra toast se não houver nenhuma imagem para mostrar
        if (!this.imagePreview) {
          this.toastr.error('Erro ao carregar carteirinha.');
        }
        */
      },
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    // Revoga URL anterior para evitar vazamento de memória
    if (this.arquivoUrlDocumento && this.arquivoUrlDocumento.startsWith('blob:')) {
      URL.revokeObjectURL(this.arquivoUrlDocumento);
    }

    this.fileToUpload = file;
    this.isPdf = file.type === 'application/pdf';
    this.documentSelected.emit(file);

    // Criamos a URL que o iframe/embed usará
    this.arquivoUrlDocumento = URL.createObjectURL(file);

    if (this.isPdf) {
      this.imagePreview = 'pdf-selected'; // Valor dummy para satisfazer o *ngIf do container
      console.log('PDF pronto para preview:', this.arquivoUrlDocumento);
    } else if (file.type.startsWith('image/')) {
      // Para imagens, mantemos o FileReader para gerar o base64 se preferir,
      // ou usamos a própria arquivoUrlDocumento
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    } else {
      this.toastr.error('Tipo de arquivo não permitido.');
      this.resetUpload();
    }
  }

  handlePreview(file: File) {
    console.log('Arquivo selecionado:', file);

    if (file.type === 'application/pdf') {
      // Caso seja PDF
      this.isPdf = true;
      this.imagePreview = null; // Limpa a preview de imagem
      this.pdfPreviewUrl = URL.createObjectURL(file); // Gera uma URL do PDF

      // Mostra a mensagem de erro, se o PDF não for aceito
      this.toastr.error('PDF não é aceito. Por favor, envie uma imagem.', 'Erro de Upload');
    } else if (file.type.startsWith('image/')) {
      // Caso seja uma imagem
      this.isPdf = false;
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
        console.log('Imagem preview gerada:', this.imagePreview);
      };
      reader.readAsDataURL(file); // Gera a URL da imagem
    } else {
      // Caso seja um tipo de arquivo não permitido
      this.toastr.error('Tipo de arquivo não permitido. Envie apenas imagens.', 'Erro de Upload');
    }
  }

  sendImage() {
    if (!this.fileToUpload || !this.person) {
      this.toastr.warning('Selecione um documento primeiro.');
      return;
    }

    const tipoArquivo: 'carteirinha' | 'documento' = 'documento';
    this.api.uploadFile(this.person.id, tipoArquivo, this.fileToUpload).subscribe({
      next: () => {
        this.toastr.success('Documento enviado com sucesso!');
        this.fileUploaded = true;
        this.isEditMode = false;

        // Atualiza o documento exibido
        const token = this.auth.getToken();
        if (token) {
          this.showDocument(this.person.id, token, 'documento');
        }
      },
      error: () => this.toastr.error('Erro ao enviar documento.'),
    });
  }

  resetUpload() {
    this.fileUploaded = false;
    this.isEditMode = true;
    this.imagePreview = '';
    this.fileToUpload = undefined;

    if (this.arquivoUrlDocumento) {
      URL.revokeObjectURL(this.arquivoUrlDocumento);
      this.arquivoUrlDocumento = '';
    }
  }

  deleteDocument() {
    this.isDeleting = true;
    this.api
      .deleteDocument(this.person.id, { facial: false, documento: true, carteirinha: false })
      .subscribe({
        next: () => {
          console.log('Documento deletado com sucesso!');
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
      this.person.statusDocumento === 'Documento Não enviado(a)' &&
      this.person.arquivoDocumento === null
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
      this.person.statusDocumento === 'Documento Não enviado(a)' &&
      this.person.arquivoDocumento === null
    ) {
      return {
        showSend: false,
        showRepeat: false,
        showDelete: false,
        disabled: true,
      };
    }

    if (
      this.person.statusDocumento === 'Documento Não enviado(a)' &&
      this.person.arquivoDocumento === null
    ) {
      console.log('CASO 1');
      return { showSend: true, showRepeat: true, showDelete: false, disabled: false };
    }

    if (
      this.person.statusDocumento === 'Documento Aprovado' &&
      this.person.arquivoDocumento !== null
    ) {
      console.log('CASO 2');
      return { showSend: false, showRepeat: false, showDelete: false, disabled: true };
    }

    if (
      this.person.statusDocumento === 'Documento Pendente' &&
      this.person.arquivoDocumento !== null
    ) {
      console.log('CASO 3');
      return { showSend: false, showRepeat: false, showDelete: false, disabled: true };
    }

    if (this.fileUploaded === true && this.person.statusDocumento !== 'Documento Rejeitado') {
      console.log('CASO 4');
      return { showSend: false, showRepeat: false, showDelete: false, disabled: true };
    }

    if (
      this.person.statusDocumento === 'Documento Rejeitado' &&
      this.person.arquivoDocumento !== null &&
      this.person.motivoRejeicaoDocumento !== null
    ) {
      console.log('CASO 5');
      return {
        showSend: false,
        showRepeat: false,
        showDelete: true,
        disabled: false,
      };
    }

    console.log('CASO 6');
    return {
      showSend: true,
      showRepeat: true,
      showDelete: false,
      disabled: false,
    };
  }
}
