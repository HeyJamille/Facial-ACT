import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AuthService } from '../../services/auth-service/auth-service';

@Component({
  selector: 'app-header',
  imports: [CommonModule],
  templateUrl: './header.html',
})
export class Header {
  menuOpen = false;
  isAdmin = false;

  constructor(private auth: AuthService) {
    this.isAdmin = this.auth.userRole === 'A';
    //console.log('IS ADMIN:', this.isAdmin);
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }
}
