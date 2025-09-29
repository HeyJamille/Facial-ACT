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

  // Token do admin (apenas como referência para testes)
  adminToken: string =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6ImFjdGhvbW9sb2dhIiwiQ2xpZW50ZVByZWZpeG8iOiIiLCJQZXJmaWwiOiJBIiwiRW50aWRhZGUiOiIyIiwibmJmIjoxNzU5MTQ5NDY5LCJleHAiOjE3NTkxNTY2NjksImlhdCI6MTc1OTE0OTQ2OSwiaXNzIjoiYXBpZmFjaWFsLmFjaGV0aWNrZXRzLmNvbS5iciIsImF1ZCI6ImFwaWZhY2lhbC5hY2hldGlja2V0cy5jb20uYnIifQ.18xvNVwzy7WRQ1XKh2vtdoYyY_ceXCbBHQPXYMDUn1w';

  constructor(private api: ApiService, private toastr: ToastrService, private router: Router) {
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

    // Add acess perfil before send
    this.person.perfilAcesso = 'U';

    const action$ = this.person.id
      ? this.api.updatePerson(this.person, this.adminToken)
      : this.api.createPerson(this.person, this.adminToken);

    action$.subscribe({
      next: (res) => {
        this.toastr.success('Pessoa registrada com sucesso!', 'Sucesso');
        setTimeout(() => {
          form.resetForm();
          this.previewUrl = undefined;
        }, 800);
      },
      error: (err) => this.toastr.error('Erro ao registrar pessoa', 'Erro'),
    });
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    this.isDragOver = false;
  }
}
