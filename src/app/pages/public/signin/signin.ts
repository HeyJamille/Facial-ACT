// Bibliotecas
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

// Components
import { AuthForm } from '../../../components/auth-form/auth-form';
import { RecoverPwd } from '../../../components/recover-pwd/recover-pwd';

// Service
import { ApiService } from '../../../services/api-service/api-service';
import { AuthService } from '../../../services/auth-service/auth-service';

// Router
import { Router } from '@angular/router';
import { Person } from '../../../models/person.model';

@Component({
  selector: 'app-signin',
  imports: [CommonModule, FormsModule, AuthForm, RecoverPwd],
  templateUrl: './signin.html',
  standalone: true,
})
export class Signin {
  email: string = '';
  password: string = '';
  loading: boolean = false;
  person: Person = {} as Person;

  @Output() linkClick = new EventEmitter<void>();

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  /*
  onSignin(data: { username: string; password: string }) {
    const currentRoute = this.router.url;
    let apiEndpoint = '';
    let redirectUrl = '';
    this.loading = true;

    // Define endpoint and redirect route
    if (currentRoute.includes('/Auth/token')) {
      apiEndpoint = 'Auth/token';
      redirectUrl = '/ListarPessoa';
    } else if (currentRoute.includes('/Auth/login')) {
      apiEndpoint = 'Auth/login';
      redirectUrl = '/EditarPessoa';
    } else {
      apiEndpoint = 'Auth/login'; // fallback
      redirectUrl = '/';
    }

    // API Call
    this.api.signin(data.username, data.password, apiEndpoint).subscribe({
      next: (res) => {
        this.auth.setToken(res.token); // Save token

        // get User ID
        const userInfo = this.auth.getUserInfo(); // call method
        const userID = userInfo?.id;
        const perfil = userInfo?.role;

        this.auth.setUserInfo({ userID, perfil });

        // Sucess toast
        this.toastr.success('Login realizado com sucesso! Redirecionando...', 'Sucesso');

        setTimeout(() => {
          this.router.navigate([redirectUrl]);
        }, 800);
      },
      error: () => this.toastr.error('Credenciais inválidas!'),
    });
  }
*/

  onSignin(data: { username: string; password: string }) {
    this.loading = true;

    const currentRoute = this.router.url.toLowerCase();
    let apiEndpoint = 'Auth/login';
    let redirectUrl = '/EditarPessoa';

    // In the current route to /auth/token, use token endpoint and redirect admin
    if (currentRoute.includes('/auth/token')) {
      apiEndpoint = 'Auth/token';
      redirectUrl = '/ListarPessoa';
    }

    this.api.signin(data.username, data.password, apiEndpoint).subscribe({
      next: (res) => {
        // Save token
        this.auth.setToken(res.token);

        const role = this.auth.getUserInfo()?.role;

        // If you are an admin or we are on the /auth/token route
        if (role === 'A' || currentRoute.includes('/auth/token')) {
          this.toastr.success('Bem-vindo, administrador!', 'Sucesso');
          this.router.navigate(['/Inicio']);
          this.loading = false;
          return;
        }

        // If you are a normal user
        if (role === 'U') {
          this.toastr.success('Bem-vindo!', 'Sucesso');
          const payload = JSON.parse(atob(res.token.split('.')[1]));
          this.router.navigate(['/EditarPessoa'], { state: { person: payload } });
          this.loading = false;
          return;
        }

        this.toastr.warning('Perfil não reconhecido!', 'Aviso');
        this.loading = false;
      },
      error: (err) => {
        this.toastr.error('Credenciais inválidas!', 'Erro');
        this.loading = false;
      },
    });
  }

  // Recover Password Modal
  showModal = false;

  openRecoverModal() {
    this.showModal = true;
  }

  closeRecoverModal() {
    this.showModal = false;
  }
}
