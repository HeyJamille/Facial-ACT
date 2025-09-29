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
    if (!this.auth.isLoggedIn()) {
      // User is logged
      this.router.navigate(['/']);
      return false;
    }

    // Routes admin can acess
    const adminRoutes = ['listPeople', 'documentsValidation'];

    const url = state.url.startsWith('/') ? state.url.slice(1) : state.url;

    if (adminRoutes.includes(url) && this.auth.userRole !== 'A') {
      // User is not a admin
      this.router.navigate(['/access-denied']);
      return false;
    }

    return true;
  }
}
