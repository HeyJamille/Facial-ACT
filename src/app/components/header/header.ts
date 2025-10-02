import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AuthService } from '../../services/auth-service/auth-service';
import { Router } from '@angular/router';

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
    this.isAdmin = userInfo?.role === 'A';
    //console.log('IS ADMIN:', this.isAdmin);
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  logout() {
    this.auth.clearToken();
    this.auth.clearUserInfo;
    this.router.navigate(['/']);
  }
}
