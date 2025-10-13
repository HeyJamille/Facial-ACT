import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

// Services
import { AuthService } from '../../services/auth-service/auth-service';

@Component({
  selector: 'app-header',
  imports: [CommonModule],
  templateUrl: './header.html',
})
export class Header {
  menuOpen = false;
  isAdmin = false;

  constructor(private auth: AuthService, private router: Router) {
    const userInfo = this.auth.getUserInfo();
    //console.log('IS ADMIN:', userInfo);
    this.isAdmin = userInfo?.role === 'A';
    //console.log('IS ADMIN:', this.isAdmin);
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  logout() {
    this.auth.clearToken();
    this.auth.clearUser();
    this.auth.clearLocalStorage();

    this.router.navigate(['/']);
  }
}
