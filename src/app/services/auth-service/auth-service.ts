import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private tokenKey = 'token';
  infoUser = 'userInfo';
  private _bypassNextGuard = false;
  private userInfoKey = 'userInfo';

  personId: string = '';

  // Token management
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

  // User management
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
    //console.log('USUÁRIO NO COOKIE:', user); // <-- aqui
    return user;
  }

  clearUser() {
    document.cookie = `${this.infoUser}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Strict;Secure`;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
    //const token = !!localStorage.getItem('token');
    //return token;
  }

  // User info management
  setUserInfo(user: any, days: number = 7) {
    const expires = new Date();
    expires.setDate(expires.getDate() + days);
    document.cookie = `${this.userInfoKey}=${encodeURIComponent(
      JSON.stringify(user)
    )};expires=${expires.toUTCString()};path=/;SameSite=Strict;Secure`;
  }

  getUserInfo() {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      //console.log('PAYLOAD JWT:', payload);
      return {
        id: payload.UsuarioID,
        role: payload.Perfil,
      };
    } catch {
      return null;
    }
  }

  // Function to temporarily release the guard
  bypassNextNavigation() {
    this._bypassNextGuard = true;
  }

  canBypassGuard(): boolean {
    if (this._bypassNextGuard) {
      this._bypassNextGuard = false; // reset after use
      return true;
    }
    return false;
  }

  // Clear all localStorage data
  clearLocalStorage() {
    localStorage.clear();
    console.log('LocalStorage limpo!');
  }

  clearImageLocalStorage() {
    localStorage.removeItem('imagecaptured');
  }

  // Função para descriptografar o token e acessar o valor de 'is'
  decodeToken(): string | null {
    const token = this.getToken();

    if (token) {
      const decodedToken: any = jwtDecode(token);

      return String(decodedToken.UsuarioID);
    }

    return null;
  }
}
