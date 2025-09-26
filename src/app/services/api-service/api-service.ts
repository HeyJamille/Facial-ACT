import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../auth-service/auth-service';

interface SigninResponse {
  token: string;
}

export interface Person {
  nomeCompleto: string;
  dataNascimento: string;
  email: string;
  celular: string;
  documento: string;
  tipo: string;
  logradouro: string;
  numero: number;
  bairro: string;
  cidade: string;
  estado: string;
  nomePai: string;
  nomeMae: string;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private baseUrl = 'https://apifacial.achetickets.com.br/api/';

  constructor(private http: HttpClient, private auth: AuthService) {}

  // Signin
  signin(username: string, password: string, endpoint: string): Observable<SigninResponse> {
    return this.http.post<SigninResponse>(`${this.baseUrl}${endpoint}`, { username, password });
  }

  getPeople(): Observable<Person[]> {
    const token = this.auth.getToken();
    if (!token) throw new Error('Usuário não autenticado');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.get<Person[]>(this.baseUrl, { headers });
  }

  // List People by ID
  getPersonById(id: number): Observable<Person> {
    return this.http.get<Person>(`${this.baseUrl}Pessoa/${id}`);
  }
}
