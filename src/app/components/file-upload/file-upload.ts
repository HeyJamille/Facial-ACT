// Bibliotescas
import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Services
import { ApiService } from '../../services/api-service/api-service';

// Components
import { Button } from '../ui/button/button';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  templateUrl: './file-upload.html',
  imports: [CommonModule, FormsModule, Button],
})
export class FileUpload implements OnChanges {
  @Output() documentSelected = new EventEmitter<File>();
  @Input() personId!: string;
  @Input() isEditMode = false;

  fileToUpload?: File;
  previewUrl?: string;
  isPdf = false;
  fileUploaded = false;

  constructor(private toastr: ToastrService, private api: ApiService) {}

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

        if (res && res.arquivoDocumento) {
          //console.log('arquivoDocumento encontrado:', res.arquivoDocumento);
          this.fileUploaded = true;
          this.isEditMode = false;
          this.previewUrl = res.arquivoDocumento;
          //this.toastr.info('Documento já enviado.');
        } else {
          this.toastr.info('Documento liberado para envio.');
          //console.log('Nenhum documento encontrado, upload ativo');
          this.isEditMode = true;
          this.fileUploaded = false;
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

    const formData = new FormData();
    formData.append('file', this.fileToUpload, this.fileToUpload.name);

    this.api.uploadFile(this.personId, formData).subscribe({
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
