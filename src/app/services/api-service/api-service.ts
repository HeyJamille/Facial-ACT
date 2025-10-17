// Bilbiotecas
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

// Services
import { AuthService } from '../auth-service/auth-service';

// Models
import { Person } from '../../models/person.model';

// Pages
import { FaceValidationResponse } from '../../pages/public/verify-cpf/verify-cpf';

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

  /* ========================= PERSON ============================ */
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

  /* ========================= FILE ============================ 
  uploadFile(personId: string, formData: FormData): Observable<any> {
    const token = this.auth.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.post(`${this.baseUrl}Pessoa/UploadArquivo/${personId}`, formData, {
      headers,
    });
  }
*/

  uploadFile(id: string, tipo: 'carteirinha' | 'documento', file: File) {
    const token = this.auth.getToken();
    if (!token) {
      console.error('Token não encontrado!');
    }

    const formData = new FormData();

    // Send to backend
    formData.append('file', file);

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    const url = `${this.baseUrl}Pessoa/UploadArquivo/${id}?tipo=${tipo}`;

    return this.http.post(url, formData, { headers });
  }

  // Download File
  downloadFile(personId: string, token: string): Observable<Blob> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.get(`${this.baseUrl}Pessoa/DownloadArquivo/${personId}`, {
      headers,
      responseType: 'blob',
    });
  }

  /* ========================= FACIAL ============================ */
  getFacialBase64(personId: string): Observable<{ base64: string }> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;

    return this.http.get<{ base64: string }>(`${this.baseUrl}Facial/Base64/${personId}`, {
      headers,
    });
  }

  // Upload Facial
  uploadFacial(personId: string, formData: FormData): Observable<any> {
    const token = this.auth.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.post(`${this.baseUrl}Facial/${personId}`, formData, { headers });
  }

  // Get Face Validation
  getFaceValidation(
    docValue: string,
    docType: 'cpf' | 'passaporte'
  ): Observable<FaceValidationResponse> {
    const params = new HttpParams().set('documento', docValue).set('tipo', docType);

    return this.http.get<FaceValidationResponse>(`${this.baseUrl}Pessoa/FacialValidada`, {
      params,
    });
  }

  // Update Facial Status
  updateFacialStatus(personId: string, status: 'Aprovado' | 'Reprovado'): Observable<any> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;

    return this.http.patch(
      `${this.baseUrl}Facial/Validar${personId}`,
      { statusValidacao: status },
      { headers }
    );
  }

  // Update Integration Facial
  updateIntegration(id: string, data: any) {
    return this.http.put(`${this.baseUrl}Pessoa/${id}/atualizar-integracao`, data);
  }

  // Fetch Facial Base64
  public async fetchFacialBase64(
    personId: string,
    token: string
  ): Promise<{ base64: string | null }> {
    try {
      const res = await fetch(`${this.baseUrl}Facial/Base64/${personId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 404) {
          // Não encontrou imagem
          return { base64: null };
        }
        throw new Error('Erro ao buscar imagem da API');
      }

      return res.json();
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  /* ========================= RECOVER PASSWORD ============================ */
  recoverPwd(email: string): Observable<any> {
    const params = new HttpParams().set('email', email); // query param

    return this.http.post(`${this.baseUrl}Pessoa/recupera-senha`, null, { params });
  }
}
