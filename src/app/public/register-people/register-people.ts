import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
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

  isEditMode: boolean = false; // false = cadastro, true = edição
  //person: Person = {} as Person;
  previewUrl?: string;
  isDragOver = false;
  pageTitle = 'Cadastro';
  buttonTitle = 'Salvar';
  selectedDocument: string = '';
  showEdit: boolean = false;
  declarationChecked: boolean = false;

  // Documento
  showDocumentFile: boolean = false;
  documentPreviewUrl?: string;

  // Facial
  facialFile?: File;
  showFaceCapture: boolean = false;

  // Files
  isPdf: boolean = false;
  fileToUpload?: File; // document
  // facialFile?: File; // facial

  constructor(
    private api: ApiService,
    private toastr: ToastrService,
    private router: Router,
    private auth: AuthService
  ) {
    /*
    const user = this.auth.getUser();
    if (user?.Perfil === 'U') {
      this.showEdit = true;
      this.pageTitle = 'Editar';
      this.buttonTitle = 'Atualizar';
    }

    const nav = this.router.getCurrentNavigation();
    const statePerson = nav?.extras.state?.['person'];
    if (statePerson) {
      this.person = { ...statePerson };
      this.pageTitle = 'Editar';
      this.buttonTitle = 'Atualizar';
    }
      */
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

    // 1️⃣ Envia os dados da pessoa
    const request$ = this.isEditMode
      ? this.api.updatePerson(this.person) // JSON
      : this.api.createPerson(this.person);

    request$
      .pipe(
        switchMap((resPerson: any) => {
          const personId = this.person.id || resPerson.id;

          // 2️⃣ Se houver foto facial, envia separadamente
          if (!this.facialFile) return of(null);

          const facialForm = new FormData();
          facialForm.append('file', this.facialFile);

          return this.api.uploadFacial(personId, facialForm); // envio da foto
        })
      )
      .subscribe({
        next: () => {
          this.toastr.success(
            this.isEditMode ? 'Pessoa atualizada com sucesso!' : 'Pessoa cadastrada com sucesso!',
            'Sucesso'
          );

          // Additional message com tempo de exibição de 5 segundos
          this.toastr.info(
            'Por favor, também envie a captura facial.',
            'Atenção',
            { timeOut: 8000 } // time
          );

          form.resetForm();
          this.previewUrl = undefined;
          this.facialFile = undefined;

          if (!this.isEditMode) {
            this.auth.bypassNextNavigation();
            setTimeout(() => this.router.navigate(['/Auth/login']), 800);
          }
        },
        error: (err) => {
          //console.error('ERRO AO SALVAR:', err);
          this.toastr.error('Erro ao salvar dados ou arquivos.', 'Erro');
        },
      });
  }

  ngOnInit(): void {
    const token = this.auth.getToken();
    this.isEditMode = !!token; // true if token = true (edit)

    if (token) {
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
