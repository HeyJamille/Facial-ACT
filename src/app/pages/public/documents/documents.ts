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
  person!: Person;
  personId!: string;

  documentFile?: File;
  declarationChecked: boolean = false;
  showFaceCapture: boolean = false;
  showDocumentFile: boolean = false;
  isEditMode: boolean = false; // false = register, true = edit
  documentUploaded = false;
  cardUploaded = false;

  messages: { text: string; type: 'success' | 'error' }[] = [];

  isLoading = false;

  constructor(
    private toastr: ToastrService,
    private router: Router,
    private auth: AuthService,
    private apiService: ApiService,
  ) {}

  ngOnInit(): void {
    const id = this.auth.decodeToken();

    if (!id) {
      console.error('ID não encontrado no token');
      return;
    }

    this.personId = id;

    this.apiService.getPersonById(id).subscribe({
      next: (person: Person) => {
        this.person = person;
        //console.log('Person carregado:', person);
      },
      error: (err) => {
        this.toastr.error('Erro ao buscar Person', err);
      },
    });
  }

  onDocumentSelected(file: File) {
    //console.log('Documento selecionado:', file);
    this.documentFile = file;
    this.documentUploaded = true;
    //this.toastr.info('Documento anexado com sucesso!');
  }

  onCardSelected(file: File) {
    //console.log('Carteirinha selecionada:', file);
    this.documentFile = file;
    this.cardUploaded = true;
    //this.toastr.info('Carteirinha anexada com sucesso!');
  }
}
