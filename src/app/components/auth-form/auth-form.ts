// Bibliotecas
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { RouterModule } from '@angular/router';
import { Button } from '../ui/button/button';

export interface AuthField {
  label: string;
  type: string;
  name: string;
  placeholder?: string;
  required: boolean;
}

@Component({
  selector: 'app-auth-form',
  imports: [CommonModule, FormsModule, RouterModule, Button],
  templateUrl: './auth-form.html',
  standalone: true,
})
export class AuthForm {
  constructor(private router: Router, private toastr: ToastrService) {}

  @Input() headerTitle!: string; // Title
  @Input() fields: AuthField[] = []; // Dinamics field
  @Input() buttonText: string = 'Enviar';
  @Input() text?: string; // Ex: "Cadastre-se!"
  @Input() linkText?: string; // Ex: "Cadastre-se!"
  @Input() linkUrl?: string;

  @Output() formSubmit = new EventEmitter<any>();
  @Output() forgotPassword = new EventEmitter<void>(); // event to open modal

  // **Novo**: evento emitido ao clicar no link
  @Output() linkClick = new EventEmitter<void>();

  onLinkClick() {
    this.forgotPassword.emit();
  }

  onSubmit(form: NgForm) {
    if (!form.valid) {
      this.toastr.warning('Preencha corretamente todos os dados!', 'Atenção');
      return;
    }

    this.formSubmit.emit(form.value);

    // Check if is signin route
    if (this.router.url.includes('/signin')) {
      this.toastr.success('Login realizado com sucesso! Redirecionando...', 'Sucesso');
      setTimeout(() => this.router.navigate(['/registerPeople']), 500);
    }

    // Check if is signup route
    if (this.router.url.includes('/signup')) {
      this.toastr.success('Cadastro realizado com sucesso! Redirecionando...', 'Sucesso');
      setTimeout(() => this.router.navigate(['/registerPeople']), 500);
    }
  }
}
