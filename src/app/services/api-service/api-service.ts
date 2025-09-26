import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../auth-service/auth-service';
import { Person } from '../../models/person.model';

interface SigninResponse {
  token: string;
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
    const token = this.auth.getToken(); // pega token do admin
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.get<Person[]>(`${this.baseUrl}Pessoa`, { headers });
  }

  // List People by ID
  getPersonById(id: number): Observable<Person> {
    return this.http.get<Person>(`${this.baseUrl}Pessoa/${id}`);
  }
}
