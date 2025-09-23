import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { Header } from '../../components/header/header';

@Component({
  selector: 'app-register-people',
  imports: [CommonModule, FormsModule, Header],
  templateUrl: './register-people.html',
})
export class RegisterPeople {
  constructor(private router: Router) {}

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
}
