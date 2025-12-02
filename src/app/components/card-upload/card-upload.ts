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
  previewUrlCard?: string;
  isPdf = false;
  cardUploaded = false;

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
          this.previewUrlCard = res.arquivoCarteirinha;
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

  onCardSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.cardToUpload = file;
      this.cardSelected.emit(file);
      this.handlePreview(file);
    }
  }

  private handlePreview(file: File) {
    if (file.type === 'application/pdf') {
      this.isPdf = true;
      this.previewUrlCard = undefined;
    } else if (file.type.startsWith('image/')) {
      this.isPdf = false;
      const reader = new FileReader();
      reader.onload = () => (this.previewUrlCard = reader.result as string);
      reader.readAsDataURL(file);
    } else {
      this.toastr.warning('Tipo de arquivo não suportado. Envie uma imagem ou PDF.');
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
        this.previewUrlCard = this.previewUrlCard || undefined;
      },
      error: () => this.toastr.error('Erro ao enviar documento.'),
    });
  }

  resetUpload() {
    this.cardUploaded = false;
    this.isEditMode = true;
    this.previewUrlCard = undefined;
    this.cardToUpload = undefined;
  }
}
