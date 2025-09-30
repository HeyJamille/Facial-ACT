import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { Header } from '../../components/header/header';
import { ToastrService } from 'ngx-toastr';
import { NgxMaskDirective } from 'ngx-mask';
import { Button } from '../../components/ui/button/button';
import { ApiService } from '../../services/api-service/api-service';
import { Person } from '../../models/person.model';
import { AuthService } from '../../services/auth-service/auth-service';
import { forkJoin, Observable, tap } from 'rxjs';

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

  // 👇 adicionar
  isPdf: boolean = false;
  fileToUpload?: File;

  constructor(
    private api: ApiService,
    private toastr: ToastrService,
    private router: Router,
    private auth: AuthService
  ) {
    // Pega o usuário logado
    const user = this.auth.getUser();

    // Se usuário existe e é perfil U, habilita edição
    if (user?.Perfil === 'U') {
      this.showEdit = true;
      this.pageTitle = 'Editar Pessoa';
      this.buttonTitle = 'Atualizar';
    }

    // Verifica se existe pessoa enviada via navegação
    const nav = this.router.getCurrentNavigation();
    const statePerson = nav?.extras.state?.['person'];
    if (statePerson) {
      this.person = { ...statePerson }; // preenche o formulário com os dados existentes
      this.pageTitle = 'Editar Pessoa';
      this.buttonTitle = 'Atualizar';
    }
  }

  onSubmit(form: NgForm) {
    console.log('Form Value:', form.value); // Show all form field
    console.log('Person Object:', this.person); // mostra o objeto person ligado ao ngModel

    if (form.invalid) {
      this.toastr.warning('Preencha todos os campos corretamente', 'Atenção');
      return;
    }

    // Search all and check for duplicates
    this.api.getPeople().subscribe({
      next: (people) => {
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

        // Add acess perfil before send
        this.person.perfilAcesso = 'U';

        const action$ = this.person.id
          ? this.api.updatePerson(this.person)
          : this.api.createPerson(this.person);

        action$.subscribe({
          next: (res) => {
            // Se tiver campo facial ou documento para enviar
            const requests = [];

            /*
            if (this.facialFile) {
              const facialForm = new FormData();
              facialForm.append('file', this.facialFile);
              requests.push(this.api.uploadFacial(resPerson.id, facialForm));
            }
            */

            if (this.fileToUpload) {
              const docForm = new FormData();
              docForm.append('file', this.fileToUpload);
              requests.push(this.api.uploadFile(docForm, this.person.id));
            }

            if (requests.length) {
              forkJoin(requests).subscribe({
                next: () =>
                  this.toastr.success('Pessoa e arquivos enviados com sucesso!', 'Sucesso'),
                error: () => this.toastr.error('Erro ao enviar arquivos', 'Erro'),
              });
            } else {
              this.toastr.success('Pessoa registrada com sucesso!', 'Sucesso');
            }

            // Reset
            setTimeout(() => {
              form.resetForm();
              this.previewUrl = undefined;
              //this.facialFile = undefined;
              this.fileToUpload = undefined;
            }, 800);
          },
          error: (err) => this.toastr.error('Erro ao registrar pessoa', 'Erro'),
        });
      },
    });
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
    this.isDragOver = false;

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
    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  // register-people.ts
  uploadDocument(personId: string): Observable<any> {
    if (!this.fileToUpload) {
      this.toastr.warning('Selecione um documento antes de enviar.', 'Atenção');
      return new Observable((observer) => observer.complete()); // retorna um Observable vazio
    }

    const formData = new FormData();
    formData.append('file', this.fileToUpload);

    return this.api.uploadFile(formData, personId).pipe(
      tap({
        next: () => this.toastr.success('Documento enviado com sucesso!', 'Sucesso'),
        error: () => this.toastr.error('Erro ao enviar documento', 'Erro'),
      })
    );
  }
}
