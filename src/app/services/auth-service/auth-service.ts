import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private tokenKey = 'token';
  private _bypassNextGuard = false;
  private userInfoKey = 'userInfo';

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
    //console.log('USUÁRIO NO COOKIE:', user); // <-- aqui
    return user;
  }

  clearUser() {
    document.cookie = `user=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Strict;Secure`;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
    //const token = !!localStorage.getItem('token');
    //return token;
  }

  // Save user informations ( Perfil and ID)
  setUserInfo(user: any, days: number = 7) {
    const expires = new Date();
    expires.setDate(expires.getDate() + days);
    document.cookie = `${this.userInfoKey}=${encodeURIComponent(
      JSON.stringify(user)
    )};expires=${expires.toUTCString()};path=/;SameSite=Strict;Secure`;
  }

  clearUserInfo() {
    document.cookie = `${this.userInfoKey}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Strict;Secure`;
  }

  // Get user informations
  getUserInfo() {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      //console.log('PAYLOAD JWT:', payload); // veja aqui o que vem
      return {
        id: payload.UsuarioID, // talvez não seja esse nome
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
}
