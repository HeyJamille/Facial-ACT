// Bibliotescas
import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// Services
import { ApiService } from '../../services/api-service/api-service';

// Components
import { Button } from '../ui/button/button';
import { AuthService } from '../../services/auth-service/auth-service';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  templateUrl: './file-upload.html',
  imports: [CommonModule, FormsModule, Button],
})
export class FileUpload implements OnChanges {
  @Output() documentSelected = new EventEmitter<File>();
  @Output() uploadMessage = new EventEmitter<{ text: string; type: 'success' | 'error' }>();
  @Input() personId!: string;
  @Input() isEditMode = false;

  fileToUpload?: File;
  previewUrl?: string;
  isPdf = false;
  fileUploaded = false;

  isAdmin = false;
  isViewMode = false;

  constructor(
    private toastr: ToastrService,
    private api: ApiService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
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

    console.log('isViewMode', this.isViewMode);
    console.log('isEditMode', this.isEditMode);
    console.log('isAdmin', this.isAdmin);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['personId'] && this.personId) {
      //console.log('personId recebido:', this.personId);
      this.checkDocument();
    }
  }

  private checkDocument() {
    this.api.getPersonById(this.personId).subscribe({
      next: (res: any) => {
        //console.log('Resposta da API getPersonById:', res);

        const url = this.router.url;

        if (res && res.arquivoDocumento) {
          //console.log('arquivoDocumento encontrado:', res.arquivoDocumento);
          this.fileUploaded = true;
          this.isEditMode = false;
          this.previewUrl = res.arquivoDocumento;
          //this.toastr.info('Documento já enviado.');
        } else {
          this.isEditMode = true;
          this.fileUploaded = false;

          // Só mostra toast se não estiver na rota visualizarPessoa
          if (!url.includes('VisualizarPessoa') && !this.isAdmin) {
            this.uploadMessage.emit({ text: 'Documento liberado para cadastro', type: 'success' });
          }
        }
      },
      error: (err) => {
        //console.error('Erro ao buscar pessoa:', err);
        this.isEditMode = true;
        this.fileUploaded = false;
      },
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.fileToUpload = file;
      this.documentSelected.emit(file);
      this.handlePreview(file);
    }
  }

  private handlePreview(file: File) {
    if (file.type === 'application/pdf') {
      this.isPdf = true;
      this.previewUrl = undefined;
    } else if (file.type.startsWith('image/')) {
      this.isPdf = false;
      const reader = new FileReader();
      reader.onload = () => (this.previewUrl = reader.result as string);
      reader.readAsDataURL(file);
    } else {
      this.toastr.warning('Tipo de arquivo não suportado. Envie uma imagem ou PDF.');
    }
  }

  sendImage() {
    if (!this.fileToUpload || !this.personId) {
      this.toastr.warning('Selecione um documento primeiro.');
      return;
    }

    const tipoArquivo: 'carteirinha' | 'documento' = 'documento';

    this.api.uploadFile(this.personId, tipoArquivo, this.fileToUpload).subscribe({
      next: () => {
        this.toastr.success('Documento enviado com sucesso!');
        this.fileUploaded = true;
        this.isEditMode = false;
        this.previewUrl = this.previewUrl || undefined;
      },
      error: () => this.toastr.error('Erro ao enviar documento.'),
    });
  }

  resetUpload() {
    this.fileUploaded = false;
    this.isEditMode = true;
    this.previewUrl = undefined;
    this.fileToUpload = undefined;
  }
}
