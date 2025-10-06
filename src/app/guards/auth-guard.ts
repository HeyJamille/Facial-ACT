// Bibliotecas
import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

// Service
import { AuthService } from '../services/auth-service/auth-service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // Check if the front has released navigation
    if (this.auth.canBypassGuard()) {
      return true;
    }

    // Normal login verification
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/']);
      return false;
    }

    const userInfo = this.auth.getUserInfo();

    // Checking admin routes
    const adminRoutes = ['ListarPessoa', 'ValidacaoDocumentos'];
    const url = state.url.startsWith('/') ? state.url.slice(1) : state.url;

    if (adminRoutes.includes(url) && userInfo?.role !== 'A') {
      this.router.navigate(['/AcessoBloqueado']);
      return false;
    }
    return true;
  }
}
