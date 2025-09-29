import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
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

  // List People
  getPeople(): Observable<Person[]> {
    const token = this.auth.getToken(); // pega token do admin
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.get<Person[]>(`${this.baseUrl}Pessoa`, { headers });
  }

  // List People by ID
  getPersonById(id: number): Observable<Person> {
    return this.http.get<Person>(`${this.baseUrl}Pessoa/${id}`);
  }

  // Get Face Validation via query params com token no Authorization
  getFaceValidation(documento: string, tipo: 'cpf' | 'cnh'): Observable<Person> {
    const token = this.auth.getToken(); // pega do cookie
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    const params = new HttpParams().set('documento', documento).set('tipo', tipo);

    return this.http.get<Person>(`${this.baseUrl}Pessoa/FacialValidada`, { headers, params });
  }

  // Create person
  createPerson(person: Person, token?: string): Observable<Person> {
    return this.http.post<Person>(`${this.baseUrl}Pessoa/`, person, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  // Update person
  updatePerson(person: Person, token?: string): Observable<Person> {
    return this.http.put<Person>(`${this.baseUrl}Pessoa/${person.id}`, person, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  // Delete person
  deletePerson(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}${id}`);
  }

  uploadFile(file: File, personId: string): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<{ url: string }>(
      `${this.baseUrl}Facial/${personId}`, // ✅ adicionando o ID da pessoa
      formData,
      {
        headers: new HttpHeaders({
          Authorization: `Bearer SEU_TOKEN_AQUI`,
        }),
      }
    );
  }
}
