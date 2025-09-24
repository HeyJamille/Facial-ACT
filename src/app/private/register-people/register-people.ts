import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { Header } from '../../components/header/header';
import { ToastrService } from 'ngx-toastr';
import { NgxMaskDirective } from 'ngx-mask';
@Component({
  selector: 'app-register-people',
  imports: [CommonModule, FormsModule, Header, NgxMaskDirective],
  templateUrl: './register-people.html',
})
export class RegisterPeople implements OnInit {
  constructor(private router: Router, private toastr: ToastrService) {}
  pageTitle: string = 'Cadastro de Pessoas';
  toastTitle: string = 'Cadastro';
  buttonTitle: string = 'Cadastrar';

  onSubmit(form: NgForm) {
    if (form.valid) {
      this.toastr.success(`${this.toastTitle} realizado(a) com sucesso!`, 'Sucesso');
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
    const state = history.state;

    if (state && state.person) {
      this.person = state.person;
      this.pageTitle = 'Editar Pessoa';
      this.toastTitle = 'Editação';
      this.buttonTitle = 'Editar';
    }
  }
}
