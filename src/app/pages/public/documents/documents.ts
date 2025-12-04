// Bibliotecas
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { NgxMaskDirective } from 'ngx-mask';
import { forkJoin, Observable, of, switchMap } from 'rxjs';

// Datas
import dataStates from '../../../data/states.json';
import dataGenres from '../../../data/genres.json';

// Components
import { Header } from '../../../components/header/header';
import { Button } from '../../../components/ui/button/button';
import { FileUpload } from '../../../components/file-upload/file-upload';
import { CardUpload } from '../../../components/card-upload/card-upload';

// Services
import { ApiService } from '../../../services/api-service/api-service';
import { AuthService } from '../../../services/auth-service/auth-service';

// Modals
import { Person } from '../../../models/person.model';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-documents',
  imports: [CommonModule, FormsModule, Header, FileUpload, CardUpload],
  templateUrl: './documents.html',
})
export class Documents {
  person: any;
  personId: string = '';

  documentFile?: File;
  declarationChecked: boolean = false;
  showFaceCapture: boolean = false;
  showDocumentFile: boolean = false;
  isEditMode: boolean = false; // false = register, true = edit
  documentUploaded = false;
  cardUploaded = false;

  messages: { text: string; type: 'success' | 'error' }[] = [];

  constructor(private toastr: ToastrService, private router: Router, private auth: AuthService) {}

  ngOnInit(): void {
    this.auth.decodeToken();

    this.personId = this.auth.personId; // Acessa o 'id' após a decodificação

    console.log('ID do usuário:', this.personId); // Verifique o id no console
  }

  onDocumentSelected(file: File) {
    this.documentFile = file;
    this.documentUploaded = true;
    //this.toastr.info('Documento anexado com sucesso!');
  }

  onCardSelected(file: File) {
    this.documentFile = file;
    this.cardUploaded = true;
    //this.toastr.info('Carteirinha anexada com sucesso!');
  }
}
