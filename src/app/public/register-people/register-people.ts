// Bibliotecas
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { NgxMaskDirective } from 'ngx-mask';
import { forkJoin, Observable, of, switchMap } from 'rxjs';

// Components
import { Header } from '../../components/header/header';
import { Button } from '../../components/ui/button/button';
import { FaceCapture } from '../../components/face-capture/face-capture';
import { FileUpload } from '../../components/file-upload/file-upload';

// Services
import { ApiService } from '../../services/api-service/api-service';
import { AuthService } from '../../services/auth-service/auth-service';

// Modals
import { Person } from '../../models/person.model';

@Component({
  selector: 'app-register-people',
  imports: [CommonModule, FormsModule, Header, NgxMaskDirective, Button, FaceCapture, FileUpload],
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

  showPassword: boolean = false;
  facialFile?: File;
  documentFile?: File;
  declarationChecked: boolean = false;
  showFaceCapture: boolean = false;
  showDocumentFile: boolean = false;

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
          console.error(err);
          this.toastr.error('Erro ao salvar dados ou enviar arquivos.', 'Erro');
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
      this.pageTitle = 'Cadastro';
    }
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
}
