// Bibliotecas
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthForm } from '../../../components/auth-form/auth-form';

@Component({
  selector: 'app-signup',
  imports: [CommonModule, FormsModule, AuthForm],
  templateUrl: './signup.html',
})
export class Signup {
  onSignup(data: any) {}
}
