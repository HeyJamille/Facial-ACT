import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private tokenKey = 'token';

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

  setUser(user: any, days: number = 7) {
    const expires = new Date();
    expires.setDate(expires.getDate() + days);
    document.cookie = `user=${encodeURIComponent(
      JSON.stringify(user)
    )};expires=${expires.toUTCString()};path=/;SameSite=Strict;Secure`;
  }

  getUser(): any {
    const match = document.cookie.match(new RegExp('(^| )user=([^;]+)'));
    const user = match ? JSON.parse(decodeURIComponent(match[2])) : null;
    console.log('USUÁRIO NO COOKIE:', user); // <-- aqui
    return user;
  }

  clearUser() {
    document.cookie = `user=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Strict;Secure`;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  get userRole(): string {
    const token = this.getToken();
    if (!token) return 'U';

    try {
      const payload = JSON.parse(atob(token.split('.')[1])); // decodifica payload
      //console.log('PAYLOAD DO TOKEN:', payload);
      return payload.Perfil || 'U'; // return 'A' or 'U'
    } catch (error) {
      //console.error('Erro ao decodificar token:', error);
      return 'U';
    }
  }
}
