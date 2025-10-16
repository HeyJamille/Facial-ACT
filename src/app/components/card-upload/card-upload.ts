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
  @Output() uploadMessage = new EventEmitter<{ text: string; type: 'success' | 'error' }>();
  @Input() personId!: string;
  @Input() isEditMode = false;

  cardToUpload?: File;
  previewUrl?: string;
  isPdf = false;
  fileUploaded = false;

  isAdmin = false;

  constructor(
    private toastr: ToastrService,
    private api: ApiService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Verify if is admin
    this.isAdmin = this.auth.getUserInfo()?.role === 'A';
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
          if (!url.includes('VisualizarPessoa')) {
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
    console.log('teste');
  }

  resetUpload() {
    this.fileUploaded = false;
    this.isEditMode = true;
    this.previewUrl = undefined;
    this.cardToUpload = undefined;
  }
}
