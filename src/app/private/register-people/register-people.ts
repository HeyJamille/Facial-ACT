import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { Header } from '../../components/header/header';

@Component({
  selector: 'app-register-people',
  imports: [CommonModule, FormsModule, Header],
  templateUrl: './register-people.html',
})
export class RegisterPeople implements OnInit {
  constructor(private router: Router) {}
  pageTitle: string = 'Cadastro de Pessoas';

  onSubmit(form: NgForm) {
    if (form.valid) {
      alert('Cadastro realizado com sucesso!');
      this.router.navigate(['/success']);
    }
  }

  // Função para validar CPF (só números e 11 dígitos)
  isCPFValid(cpf: string): boolean {
    const cleaned = cpf.replace(/\D/g, '');
    return cleaned.length === 11;
  }

  person: any = {
    id: null,
    name: '',
    email: '',
    dateOfBirth: '',
    phone: '',
    cpf: '',
    road: '',
    number: null,
    district: '',
    cep: '',
    city: '',
    state: '',
  };

  ngOnInit() {
    // Pega os dados passados pelo router
    const state = history.state;

    if (state && state.person) {
      this.person = state.person;
      this.pageTitle = 'Editar Pessoa';
    }
  }
}
