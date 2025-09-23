import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-verify-cpf',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './verify-cpf.html',
})
export class VerifyCPF {
  constructor(private router: Router) {}

  onSubmit(form: NgForm) {
    alert('CPF Válido! Redirecionando para a página de cadastro.');
  }
}
