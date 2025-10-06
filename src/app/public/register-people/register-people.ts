import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Header } from '../../components/header/header';
import { ToastrService } from 'ngx-toastr';
import { NgxMaskDirective } from 'ngx-mask';
import { Button } from '../../components/ui/button/button';
import { ApiService } from '../../services/api-service/api-service';
import { Person } from '../../models/person.model';
import { AuthService } from '../../services/auth-service/auth-service';
import { forkJoin, Observable, of, switchMap } from 'rxjs';
import { FaceCapture } from '../../components/face-capture/face-capture';
@Component({
  selector: 'app-register-people',
  imports: [CommonModule, FormsModule, Header, NgxMaskDirective, Button, FaceCapture],
  templateUrl: './register-people.html',
})
export class RegisterPeople {
  person: Person = {
    tipo: '',
    estado: '',
  } as Person;

  isEditMode: boolean = false; // false = register, true = edit
  //person: Person = {} as Person;
  previewUrl?: string;
  isDragOver = false;
  pageTitle = 'Cadastro';
  buttonTitle = 'Salvar';
  selectedDocument: string = '';
  showEdit: boolean = false;
  declarationChecked: boolean = false;
  loading: boolean = false;

  // Document
  showDocumentFile: boolean = false;
  documentPreviewUrl?: string;

  // Facial
  facialFile?: File;
  showFaceCapture: boolean = false;

  // Files
  isPdf: boolean = false;
  fileToUpload?: File; // document
  // facialFile?: File; // facial

  showPassword: boolean = false;

  constructor(
    private api: ApiService,
    private toastr: ToastrService,
    private router: Router,
    private auth: AuthService
  ) {
    // Check if there's state passed from navigation
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state;

    if (state && state['person']) {
      this.person = state['person']; // complet object
      this.pageTitle = 'Editar Pessoa';
      this.buttonTitle = 'Atualizar';
    }
  }

  onSubmit(form: NgForm) {
    if (form.invalid || !this.declarationChecked) {
      if (!this.declarationChecked) {
        this.toastr.warning('Você deve aceitar os termos para continuar', 'Atenção');
      } else {
        this.toastr.warning('Preencha todos os campos corretamente', 'Atenção');
      }
      return;
    }

    this.loading = true;

    const personToSend = { ...this.person };

    // Ajuste de campos vazios
    if (!personToSend.nomePai || personToSend.nomePai.trim() === '') {
      personToSend.nomePai = 'Não informado';
    }

    if (this.isEditMode && (!personToSend.senha || personToSend.senha.trim() === '')) {
      delete personToSend.senha;
    }

    const request$ = this.isEditMode
      ? this.api.updatePerson(personToSend)
      : this.api.createPerson(personToSend); // Cadastro

    request$
      .pipe(
        switchMap((resPerson: any) => {
          // Somente no cadastro
          if (!this.isEditMode && resPerson.token) {
            this.auth.setToken(resPerson.token);
            this.showFaceCapture = true; // habilita captura facial
          }

          // Se tiver foto facial, envia
          if (this.facialFile) {
            const facialForm = new FormData();
            facialForm.append('file', this.facialFile);
            return this.api.uploadFacial(resPerson.id, facialForm);
          }

          return of(null);
        })
      )
      .subscribe({
        next: () => {
          this.toastr.success(
            this.isEditMode
              ? 'Cadastro atualizado com sucesso!'
              : 'Cadastro realizado com sucesso!',
            'Sucesso'
          );

          this.loading = false;

          // Redirect to EditarPessoa after 1 second
          setTimeout(() => {
            this.router.navigate(['/EditarPessoa']);
          }, 1000);

          /*
          if (!this.isEditMode) {
            this.auth.bypassNextNavigation();
            setTimeout(() => this.router.navigate(['/Auth/login']), 800);
          }
            */
        },
        error: () => {
          this.toastr.error('Dados pessoas já salvos.', 'Erro');
          this.loading = false;
        },
      });
  }

  ngOnInit(): void {
    const token = this.auth.getToken();
    this.isEditMode = !!token; // token = edit

    if (this.isEditMode) {
      this.isEditMode = true;
      this.pageTitle = 'Alterar Dados Cadastrais';
      this.buttonTitle = 'Atualizar';
      this.showFaceCapture = true; // show capture facial
      this.showDocumentFile = false; // document disabled

      // Get user Id
      const userInfo = this.auth.getUserInfo();
      const userId = userInfo?.id;

      //console.log('USERID:', userId);
      //console.log('USERINFO:', userInfo);

      if (userId) {
        this.api.getPersonById(userId).subscribe({
          next: (data) => {
            // remove password
            const { senha, ...personWithoutPassword } = data;
            this.person = { ...personWithoutPassword };
          },
          error: () => {
            this.toastr.error('Erro ao carregar dados do usuário.', 'Erro');
          },
        });
      }
    } else {
      this.isEditMode = false;
      this.showFaceCapture = false; // captura facial desativada
      this.showDocumentFile = false;
      this.pageTitle = 'Cadastro';
      this.buttonTitle = 'Salvar';
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    this.isDragOver = false;
  }

  onFileDropped(event: DragEvent) {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.facialFile = input.files[0]; // save file
      this.handleFile(this.facialFile);
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  private handleFile(file: File) {
    this.fileToUpload = file; // Save file

    // Generate preview
    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl = reader.result as string;
    };
    reader.readAsDataURL(file);
  }
}
