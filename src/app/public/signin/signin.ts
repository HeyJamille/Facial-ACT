// Bibliotecas
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

// Components
import { AuthForm } from '../../components/auth-form/auth-form';
import { RecoverPwd } from '../../components/recover-pwd/recover-pwd';

// Service
import { ApiService } from '../../services/api-service/api-service';
import { AuthService } from '../../services/auth-service/auth-service';

// Router
import { Router } from '@angular/router';

@Component({
  selector: 'app-signin',
  imports: [CommonModule, FormsModule, AuthForm, RecoverPwd],
  templateUrl: './signin.html',
})
export class Signin {
  email: string = '';
  password: string = '';
  @Output() linkClick = new EventEmitter<void>();

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  onSignin(data: { username: string; password: string }) {
    const currentRoute = this.router.url;
    let apiEndpoint = '';
    let redirectUrl = '';

    // Define endpoint and redirect route
    if (currentRoute.includes('/Auth/token')) {
      apiEndpoint = 'Auth/token';
      redirectUrl = '/listPeople';
    } else if (currentRoute.includes('/Auth/login')) {
      apiEndpoint = 'Auth/login';
      redirectUrl = '/registerPeople';
    } else {
      apiEndpoint = 'Auth/login'; // fallback
      redirectUrl = '/';
    }

    // API Call
    this.api.signin(data.username, data.password, apiEndpoint).subscribe({
      next: (res) => {
        this.auth.setToken(res.token); // Save token

        // Sucess toast
        this.toastr.success('Login realizado com sucesso! Redirecionando...', 'Sucesso');

        setTimeout(() => {
          this.router.navigate([redirectUrl]);
        }, 800);
      },
      error: () => this.toastr.error('Credenciais inválidas!'),
    });
  }

  /*
   onSignin(data: { username: string; password: string }) {
    this.api.signin(data.username, data.password, 'Auth/token').subscribe({
      next: (res) => {
        // Salva o token
        this.auth.setToken(res.token);

        // Pega o perfil de acesso (A ou U)
        const role = this.auth.userRole;

        if (role === 'A') {
          this.toastr.success('Bem-vindo, administrador!', 'Sucesso');
          this.router.navigate(['/listPeople']); // rota admin
        } else if (role === 'U') {
          this.toastr.success('Bem-vindo!', 'Sucesso');

          // Aqui você pode navegar para registerPeople
          // e já passar o payload inteiro do token (se ele já contém os dados do usuário)
          const payload = JSON.parse(atob(res.token.split('.')[1]));
          this.router.navigate(['/registerPeople'], { state: { person: payload } });
        } else {
          this.toastr.warning('Perfil não reconhecido!', 'Aviso');
        }
      },
      error: () => this.toastr.error('Credenciais inválidas!', 'Erro'),
    });
  }
  */

  // Recover Password Modal
  showModal = false;

  openRecoverModal() {
    this.showModal = true;
  }

  closeRecoverModal() {
    this.showModal = false;
  }
}
