// Bibliotecas
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { RouterModule } from '@angular/router';

// Componentes
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
  @Input() text?: string; // Ex: "Cadastre-se!"
  @Input() linkText?: string; // Ex: "Cadastre-se!"
  @Input() linkUrl?: string;
  @Input() loading: boolean = false;

  @Output() formSubmit = new EventEmitter<any>();
  @Output() forgotPassword = new EventEmitter<void>(); // event to open modal

  showPassword = false;

  onLinkClick() {
    this.forgotPassword.emit();
  }

  onSubmit(form: NgForm) {
    if (!form.valid) {
      this.toastr.warning('Preencha corretamente todos os dados!', 'Atenção');
      return;
    }

    this.formSubmit.emit(form.value);
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }
}
