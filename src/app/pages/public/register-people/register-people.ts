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
import { FaceCapture } from '../../../components/face-capture/face-capture';

@Component({
  selector: 'app-register-people',
  imports: [CommonModule, FormsModule, Header, NgxMaskDirective, Button],
  templateUrl: './register-people.html',
})
export class RegisterPeople {
  person: Person = {
    tipo: '',
    estado: '',
    sexo: '',
  } as Person;

  isEditMode: boolean = false; // false = register, true = edit
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

  states = dataStates;
  genres = dataGenres;

  selectedState: string = '';
  selectedGenre: string = '';

  docType: string | null = null;
  docValue: string | null = null;
  disableDocInput = false;

  messages: { text: string; type: 'success' | 'error' }[] = [];

  constructor(
    private api: ApiService,
    private toastr: ToastrService,
    private router: Router,
    private auth: AuthService,
    private http: HttpClient
  ) {
    // Check if there's state passed from navigation
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state;

    if (state && state['person']) {
      this.person = state['person']; // complet object
    }

    const storedDocType = localStorage.getItem('docType');
    const storedDocValue = localStorage.getItem('docValue');

    if (storedDocType && storedDocValue) {
      this.docType = storedDocType;
      this.docValue = storedDocValue;
      this.disableDocInput = true;

      this.person.tipo = this.docType;
      this.person.documento = this.docValue;

      localStorage.removeItem('docType');
      localStorage.removeItem('docValue');
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

    // Dont send password if empty in edit mode or is view mode
    if (this.isEditMode || this.isViewMode) {
      // Se o campo senha estiver vazio, não envia (mantém a antiga)
      if (!personToSend.senha || personToSend.senha.trim() === '') {
        delete personToSend.senha;
      } else if (personToSend.senha.length < 6) {
        this.toastr.error('A senha deve ter pelo menos 6 caracteres.');
        this.loading = false;
        return;
      }
    }

    /*
    console.log('personToSend.senha', personToSend.senha);
    console.log('is admin', this.isAdmin);
    console.log('edit mode', this.isEditMode);
    console.log('is view mode', this.isViewMode);
    */
    const request$ =
      this.isEditMode || (this.isAdmin && this.isViewMode)
        ? this.api.updatePerson(personToSend)
        : this.api.createPerson(personToSend);

    request$
      .pipe(
        switchMap((resPerson: any) => {
          // Only perform this logic if there is a return and for a new registration
          if (resPerson && !this.isEditMode && resPerson.token) {
            this.auth.setToken(resPerson.token);
            this.showFaceCapture = true;
          }
          return of(resPerson);
        })
      )
      .subscribe({
        next: () => {
          this.toastr.success(
            this.isEditMode || this.isViewMode
              ? 'Cadastro atualizado com sucesso!'
              : 'Cadastro realizado com sucesso!',
            'Sucesso'
          );

          this.loading = false;

          // Redirect to Documents after 1 second
          if (!this.isEditMode && !this.isViewMode) {
            setTimeout(() => {
              console.log('personToSend', personToSend);
              console.log('this.person ', this.person);
              // Navegar para a página /Documentos passando o objeto 'pessoa' como estado
              this.router.navigate(['/Documentos'], { state: { personToSend: this.person } });
            }, 1000);
          }
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
      this.isViewMode = true; // lock everything
      this.isEditMode = false;
    }
    // Register person → everything unlocked
    else if (url.includes('RegistrarPessoa')) {
      this.pageTitle = 'Cadastro';
      this.isViewMode = false; // desbloqueia tudo
      this.isEditMode = false;
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
    //this.toastr.info('Documento anexado com sucesso!');
  }

  onCardSelected(file: File) {
    this.documentFile = file;
    //this.toastr.info('Carteirinha anexada com sucesso!');
  }

  // Function para verify actual recent
  isVisualizarPessoaRoute(): boolean {
    return this.router.url.includes('VisualizarPessoa');
  }

  addMessage(message: string, type: 'success' | 'error' = 'success') {
    this.messages.push({ text: message, type });
  }

  searchCep(): void {
    const cep = this.person.cep;
    if (!cep) return;

    this.api.searchCep(cep).subscribe({
      next: (dados) => {
        if (!dados.erro) {
          this.person.logradouro = dados.logradouro;
          this.person.bairro = dados.bairro;
          this.person.cidade = dados.localidade;
          this.person.estado = dados.uf;
        } else {
          //console.warn('CEP não encontrado');
        }
      },
      error: (err) => {
        //console.error('Erro ao buscar CEP:', err);
      },
    });
  }
}
