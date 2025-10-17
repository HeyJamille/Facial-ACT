// Bibliotecas
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { NgxMaskDirective } from 'ngx-mask';
import { forkJoin, Observable, of, switchMap } from 'rxjs';

// Components
import { Header } from '../../../components/header/header';
import { Button } from '../../../components/ui/button/button';
import { FaceCapture } from '../../../components/face-capture/face-capture';
import { FileUpload } from '../../../components/file-upload/file-upload';
import { CardUpload } from '../../../components/card-upload/card-upload';

// Services
import { ApiService } from '../../../services/api-service/api-service';
import { AuthService } from '../../../services/auth-service/auth-service';

// Modals
import { Person } from '../../../models/person.model';

@Component({
  selector: 'app-register-people',
  imports: [
    CommonModule,
    FormsModule,
    Header,
    NgxMaskDirective,
    Button,
    FaceCapture,
    FileUpload,
    CardUpload,
  ],
  templateUrl: './register-people.html',
})
export class RegisterPeople {
  person: Person = {
    tipo: '',
    estado: '',
  } as Person;

  isEditMode: boolean = false; // false = register, true = edit
  //person: Person = {} as Person;
  pageTitle = '';
  buttonTitle = 'Salvar';
  showEdit: boolean = false;
  loading: boolean = false;
  isAdmin = false;

  showPassword: boolean = false;
  facialFile?: File;
  documentFile?: File;
  declarationChecked: boolean = false;
  showFaceCapture: boolean = false;
  showDocumentFile: boolean = false;

  isFacialAllowed = false;
  isFileUploadAllowed = false;

  isViewMode = false;

  messages: { text: string; type: 'success' | 'error' }[] = [];

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
    }

    // Verify if is admin
    this.isAdmin = this.auth.getUserInfo()?.role === 'A';
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

    // Define defautl values
    if (!personToSend.nomePai || personToSend.nomePai.trim() === '') {
      personToSend.nomePai = 'Não informado';
    }

    // Dont send password if empty in edit mode
    if (this.isEditMode && (!personToSend.senha || personToSend.senha.trim() === '')) {
      delete personToSend.senha;
    }

    const request$ = this.isEditMode
      ? this.api.updatePerson(personToSend)
      : this.api.createPerson(personToSend);

    request$
      .pipe(
        switchMap((resPerson: any) => {
          // New registration
          if (!this.isEditMode && resPerson.token) {
            this.auth.setToken(resPerson.token);
            this.showFaceCapture = true;
          }
          return of(resPerson);
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
        },
        error: (err) => {
          //console.error(err);

          const backendMessage = err.error?.mensagem || 'Erro desconhecido contate o suporte.';

          this.toastr.error(backendMessage, 'Erro');
          this.loading = false;
        },
      });
  }

  ngOnInit(): void {
    const token = this.auth.getToken();
    const userInfo = this.auth.getUserInfo();
    const userId = userInfo?.id;
    const url = this.router.url;

    //console.log('Token:', token);
    //console.log('userInfo:', userInfo);
    //console.log('URL atual:', url);

    this.pageTitle = 'Cadastro';
    this.isViewMode = false;
    this.isEditMode = false;
    this.isAdmin = userInfo?.role === 'A';
    //console.log('isAdmin:', this.isAdmin);

    // View person → all unlocked
    if (url.includes('VisualizarPessoa')) {
      this.pageTitle = 'Visualizar Dados Cadastrais';
      this.isViewMode = false; // lock everything
      this.isEditMode = false;
    }
    // Register person → everything unlocked
    else if (url.includes('RegistrarPessoa')) {
      this.pageTitle = 'Cadastro';
      this.isViewMode = true; // desbloqueia tudo
      this.isEditMode = false;

      if (userId) {
        this.api.getPersonById(userId).subscribe({
          next: (data) => {
            const { senha, ...personWithoutPassword } = data;
            this.person = { ...personWithoutPassword };
            console.log('this.person após API:', this.person);
          },
          error: () => {
            this.toastr.error('Erro ao carregar dados do usuário.', 'Erro');
          },
        });
      }
    }
    // Edit person → block email, type and document
    else if (url.includes('EditarPessoa')) {
      this.pageTitle = 'Alterar Dados Cadastrais';
      this.isEditMode = true; // bloqueia campos específicos
      this.isViewMode = false; // bloqueia o resto
    }
    // Other case → block everything
    else {
      this.isEditMode = false;
      this.isViewMode = false;
    }

    if (
      (this.isAdmin && this.isEditMode) ||
      userId === this.person.id ||
      (!this.isAdmin && userId)
    ) {
      this.api.getPersonById(userId).subscribe({
        next: (data) => {
          // remove password
          const { senha, ...personWithoutPassword } = data;
          this.person = { ...personWithoutPassword };
        },
        error: () => {
          const url = this.router.url;

          if (!url.includes('RegistrarPessoa')) {
            this.toastr.error('Erro ao carregar dados do usuário.', 'Erro');
          }
        },
      });
    }

    //console.log('isEditMode final:', this.isEditMode);
    //console.log('isViewMode final:', this.isViewMode);
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onFacialCaptured(file: File) {
    this.facialFile = file;
    this.toastr.info('Foto facial capturada com sucesso!');
  }

  onDocumentSelected(file: File) {
    this.documentFile = file;
    this.toastr.info('Documento anexado com sucesso!');
  }

  onCardSelected(file: File) {
    this.documentFile = file;
    this.toastr.info('Carteirinha anexada com sucesso!');
  }

  // Function para verify actual recent
  isVisualizarPessoaRoute(): boolean {
    return this.router.url.includes('VisualizarPessoa');
  }

  addMessage(message: string, type: 'success' | 'error' = 'success') {
    this.messages.push({ text: message, type });
  }
}
