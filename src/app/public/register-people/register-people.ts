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
import { forkJoin, Observable } from 'rxjs';

@Component({
  selector: 'app-register-people',
  imports: [CommonModule, FormsModule, Header, NgxMaskDirective, Button],
  templateUrl: './register-people.html',
})
export class RegisterPeople {
  person: Person = {} as Person;
  previewUrl?: string;
  isDragOver = false;
  pageTitle = 'Registrar Pessoa';
  buttonTitle = 'Salvar';
  selectedDocument: string = '';
  showEdit: boolean = false;

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
    const user = this.auth.getUser();
    if (user?.Perfil === 'U') {
      this.showEdit = true;
      this.pageTitle = 'Editar Pessoa';
      this.buttonTitle = 'Atualizar';
    }

    const nav = this.router.getCurrentNavigation();
    const statePerson = nav?.extras.state?.['person'];
    if (statePerson) {
      this.person = { ...statePerson };
      this.pageTitle = 'Editar Pessoa';
      this.buttonTitle = 'Atualizar';
    }
  }

  onSubmit(form: NgForm) {
    if (form.invalid) {
      this.toastr.warning('Preencha todos os campos corretamente', 'Atenção');
      return;
    }
    /*
    if (!this.fileToUpload) {
      //|| !this.facialFile
      this.toastr.warning('Documento e foto facial são obrigatórios!', 'Atenção');
      return;
    }
    */
    this.person.perfilAcesso = 'U';
    const action$ = this.person.id
      ? this.api.updatePerson(this.person)
      : this.api.createPerson(this.person);

    action$.subscribe({
      next: () => {
        this.toastr.success('Pessoa cadastrada com sucesso!', 'Sucesso'),
          setTimeout(() => {
            form.resetForm();
          }, 800);
      },
      error: () => this.toastr.error('Erro ao cadastrar pessoa', 'Erro'),
    });

    /*
    this.api.getPeople().subscribe((people) => {
      const docAndTypeExists = people.some(
        (p) =>
          p.documento === this.person.documento &&
          p.tipo === this.person.tipo &&
          p.id !== this.person.id
      );
      const emailExists = people.some(
        (p) => p.email === this.person.email && p.id !== this.person.id
      );

      if (docAndTypeExists) {
        this.toastr.error('Documento já cadastrado!', 'Erro');
        return;
      }
      if (emailExists) {
        this.toastr.error('E-mail já cadastrado!', 'Erro');
        return;
      }
     
      this.person.perfilAcesso = 'U';
      const action$ = this.person.id
        ? this.api.updatePerson(this.person)
        : this.api.createPerson(this.person);

      action$.subscribe({
        next: (resPerson) => {
          const requests: Observable<any>[] = [];

          // Upload documento
          const docForm = new FormData();
          docForm.append('file', this.fileToUpload!);
          requests.push(this.api.createFile(docForm, resPerson.id));

          //Upload facial
          //const facialForm = new FormData();
          //facialForm.append('file', this.facialFile!);
          //requests.push(this.api.uploadFile(resPerson.id, facialForm));

          forkJoin(requests).subscribe({
            next: () =>
              this.toastr.success('Pessoa e arquivos cadastrados com sucesso!', 'Sucesso'),
            error: () => this.toastr.error('Erro ao enviar arquivos', 'Erro'),
          });

          setTimeout(() => {
            form.resetForm();
            this.previewUrl = undefined;
            this.fileToUpload = undefined;
            //this.facialFile = undefined;
          }, 800);
        },
        error: () => this.toastr.error('Erro ao cadastrar pessoa', 'Erro'),
      });
    });
    */
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
      this.handleFile(input.files[0]);
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
