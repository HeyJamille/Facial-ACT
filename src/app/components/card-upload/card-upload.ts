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
  selector: 'app-card-upload',
  standalone: true,
  templateUrl: './card-upload.html',
  imports: [CommonModule, FormsModule, Button],
})
export class CardUpload implements OnChanges {
  @Output() cardSelected = new EventEmitter<File>();
  @Input() person!: string;
  @Input() isEditMode = false;

  cardToUpload?: File;
  isPdf = false;
  cardUploaded = false;
  imagePreview: string | null = null;
  pdfPreviewUrl: string | null = null; // URL do PDF

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

    /*
    console.log('isViewMode', this.isViewMode);
    console.log('isEditMode', this.isEditMode);
    console.log('isAdmin', this.isAdmin);
    */
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['person'] && this.person) {
      //console.log('person recebido:', this.person);
      this.checkCard();
    }
  }

  private checkCard() {
    this.api.getPersonById(this.person).subscribe({
      next: (res: any) => {
        //console.log('Resposta da API getPersonById:', res);

        const url = this.router.url;

        if (res && res.arquivoCarteirinha) {
          //console.log('arquivoCarteirinha encontrado:', res.arquivoCarteirinha);
          this.cardUploaded = true;
          this.isEditMode = false;
          this.imagePreview = res.arquivoCarteirinha;
          //this.toastr.info('Documento já enviado.');
        } else {
          this.isEditMode = true;
          this.cardUploaded = false;
        }
      },
      error: (err) => {
        //console.error('Erro ao buscar pessoa:', err);
        this.isEditMode = true;
        this.cardUploaded = false;
      },
    });
  }

  // Componente .ts (Exemplo)
  onCardSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.cardToUpload = file;

      // Verifica o tipo de arquivo
      this.isPdf = file.type === 'application/pdf';
      this.cardSelected.emit(file);

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

  sendImage() {
    console.log('cardToUpload', this.cardToUpload);
    console.log('this.person', this.person);
    if (!this.cardToUpload || !this.person) {
      this.toastr.warning('Selecione um documento primeiro.');
      return;
    }

    const tipoArquivo: 'carteirinha' | 'documento' = 'carteirinha';

    this.api.uploadFile(this.person, tipoArquivo, this.cardToUpload).subscribe({
      next: () => {
        this.toastr.success('Documento enviado com sucesso!');
        this.cardUploaded = true;
        this.isEditMode = false;
        this.imagePreview = this.imagePreview || null;
      },
      error: () => this.toastr.error('Erro ao enviar documento.'),
    });
  }

  resetUpload() {
    this.cardUploaded = false;
    this.isEditMode = true;
    this.imagePreview = null;
    this.cardToUpload = undefined;
  }
}
