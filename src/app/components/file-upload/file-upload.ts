import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from '../../services/api-service/api-service';
import { AuthService } from '../../services/auth-service/auth-service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Button } from '../ui/button/button';

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.html',
  imports: [CommonModule, FormsModule, Button],
})
export class FileUpload implements OnChanges {
  @Output() documentSelected = new EventEmitter<File>();
  @Output() uploadMessage = new EventEmitter<{ text: string; type: 'success' | 'error' }>();
  @Input() person!: string;
  @Input() isEditMode = false;

  fileToUpload?: File;
  imagePreview: string | null = null;
  pdfPreviewUrl: string | null = null; // URL do PDF

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

  ngOnChanges(changes: SimpleChanges) {
    if (changes['person'] && this.person) {
      // Atualiza o estado do upload quando a pessoa mudar
      this.checkDocument();
    }
  }

  private checkDocument() {
    this.api.getPersonById(this.person).subscribe({
      next: (res: any) => {
        //console.log('Resposta da API getPersonById:', res);

        const url = this.router.url;

        if (res && res.arquivoDocumento) {
          //console.log('arquivoDocumento encontrado:', res.arquivoDocumento);
          this.fileUploaded = true;
          this.isEditMode = false;
          this.imagePreview = res.arquivoDocumento;
          //this.toastr.info('Documento já enviado.');
        } else {
          this.isEditMode = true;
          this.fileUploaded = false;

          // Only shows toast if not in the viewPerson route
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

  // Componente .ts (Exemplo)
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.fileToUpload = file;

      // Verifica o tipo de arquivo
      this.isPdf = file.type === 'application/pdf';
      this.documentSelected.emit(file);

      if (this.isPdf) {
        // Para PDF, define um valor para que o bloco de preview (*ngIf="imagePreview") seja ativado.
        this.imagePreview = 'pdf-selected';
      } else if (file.type.startsWith('image/')) {
        // Para imagens, cria o DataURL para exibição
        const reader = new FileReader();
        reader.onload = (e) => {
          this.imagePreview = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      }
    }
  }

  // Função para gerar o preview do arquivo (imagem ou PDF)
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

  // Enviar o arquivo para o backend
  sendImage() {
    if (!this.fileToUpload || !this.person) {
      this.toastr.warning('Selecione um documento primeiro.');
      return;
    }

    const tipoArquivo: 'carteirinha' | 'documento' = 'documento';

    this.api.uploadFile(this.person, tipoArquivo, this.fileToUpload).subscribe({
      next: () => {
        this.toastr.success('Documento enviado com sucesso!');
        this.fileUploaded = true;
        this.isEditMode = false;
        this.imagePreview = this.imagePreview || null;
      },
      error: () => this.toastr.error('Erro ao enviar documento.'),
    });
  }

  // Função para resetar o estado do upload
  resetUpload() {
    this.fileUploaded = false;
    this.isEditMode = true;
    this.imagePreview = null;
    this.fileToUpload = undefined;
  }
}
