import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../auth-service/auth-service';
import { Person } from '../../models/person.model';
import { FaceValidationResponse } from '../../public/verify-cpf/verify-cpf';

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
  getPersonById(id: string) {
    const token = this.auth.getToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.get<any>(`${this.baseUrl}Pessoa/${id}`, { headers });
  }

  // Create person
  createPerson(person: Person): Observable<Person> {
    //const token = this.auth.getToken(); // get cookie
    //const headers = token
    //  ? new HttpHeaders({ Authorization: `Bearer ${token}` })
    //: new HttpHeaders();

    return this.http.post<Person>(`${this.baseUrl}Pessoa/`, person);
  }

  // Update person
  updatePerson(person: Person): Observable<Person> {
    const token = this.auth.getToken(); // get cookie
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;

    return this.http.put<Person>(`${this.baseUrl}Pessoa/${person.id}`, person, {
      headers,
    });
  }

  // Delete person
  deletePerson(id: string): Observable<any> {
    const token = this.auth.getToken(); // get cookie
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;

    return this.http.delete(`${this.baseUrl}Pessoa/${id}`, { headers });
  }

  //
  createFile(formData: FormData, personId: string): Observable<any> {
    const token = this.auth.getToken();
    const headers = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();

    // Endpoint que usa o id da pessoa
    return this.http.post(`${this.baseUrl}Facial/${personId}`, formData, { headers });
  }

  // Get Base64 file by ID (com token)
  getFacialBase64(personId: string): Observable<string> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;

    return this.http.get(`${this.baseUrl}Facial/Base64/${personId}`, {
      headers,
      responseType: 'text', // Importante! Base64 vem como texto
    });
  }

  // Get Face Validation via query params with token in Authorization
  getFaceValidation(
    docValue: string,
    docType: 'cpf' | 'passaporte'
  ): Observable<FaceValidationResponse> {
    const params = new HttpParams().set('documento', docValue).set('tipo', docType);

    return this.http.get<FaceValidationResponse>(`${this.baseUrl}Pessoa/FacialValidada`, {
      params,
    });
  }

  uploadFacial(personId: string, formData: FormData): Observable<any> {
    const token = this.auth.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.post(`${this.baseUrl}Facial/${personId}`, formData, { headers });
  }

  uploadDocumento(personId: string, formData: FormData): Observable<any> {
    const token = this.auth.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.post(`${this.baseUrl}Pessoa/${personId}/UploadDocumento`, formData, {
      headers,
    });
  }

  updatePersonWithFormData(formData: FormData, id: string): Observable<any> {
    return this.http.put(`${this.baseUrl}Pessoa/${id}`, formData);
  }

  createPersonWithFormData(formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}Pessoa`, formData);
  }
}
