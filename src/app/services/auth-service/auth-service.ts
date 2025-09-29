import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private tokenKey = 'token';

  // ---------- TOKEN ----------
  setToken(token: string, days: number = 7) {
    const expires = new Date();
    expires.setDate(expires.getDate() + days);
    document.cookie = `${
      this.tokenKey
    }=${token};expires=${expires.toUTCString()};path=/;SameSite=Strict;Secure`;
  }

  getToken(): string | null {
    const match = document.cookie.match(new RegExp('(^| )' + this.tokenKey + '=([^;]+)'));
    return match ? match[2] : null;
  }

  clearToken() {
    document.cookie = `${this.tokenKey}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Strict;Secure`;
  }

  // ---------- USUÁRIO ----------
  setUser(user: any, days: number = 7) {
    const expires = new Date();
    expires.setDate(expires.getDate() + days);
    document.cookie = `user=${encodeURIComponent(
      JSON.stringify(user)
    )};expires=${expires.toUTCString()};path=/;SameSite=Strict;Secure`;
  }

  getUser(): any {
    const match = document.cookie.match(new RegExp('(^| )user=([^;]+)'));
    return match ? JSON.parse(decodeURIComponent(match[2])) : null;
  }

  clearUser() {
    document.cookie = `user=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Strict;Secure`;
  }

  // ---------- PERFIL ----------
  getPerfilAcesso(): string {
    const user = this.getUser();
    return user ? user.perfilAcesso : '';
  }

  isAdmin(): boolean {
    return this.getPerfilAcesso() === 'A';
  }

  // ---------- LOGIN ----------
  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
