import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root', // <- isso torna o serviço disponível globalmente
})
export class AuthService {
  private tokenKey = 'token'; // chave para salvar o token no localStorage
  private roleKey = 'userRole';

  /*
  setToken(token: string, role: 'user' | 'admin') {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.roleKey, role);
  }
  */

  // Salvar token
  setToken(token: string) {
    localStorage.setItem(this.tokenKey, token);
  }

  // Pegar token
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // Remover token (logout)
  clearToken() {
    localStorage.removeItem(this.tokenKey);
  }

  // Verificar se usuário está logado
  isLoggedIn(): boolean {
    return !!this.getToken(); // retorna true se houver token
  }
}
