// Bibliotecas
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { NgxMaskDirective } from 'ngx-mask';
import { ToastrService } from 'ngx-toastr';

// Components
import { Button } from '../../../components/ui/button/button';

// Services
import { ApiService } from '../../../services/api-service/api-service';
import { AuthService } from '../../../services/auth-service/auth-service';

export interface FaceValidationResponse {
  facialValidada: boolean;
}

@Component({
  selector: 'app-verify-cpf',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxMaskDirective, Button],
  templateUrl: './verify-cpf.html',
})
export class VerifyCPF {
  selectedDocument: string = '';
  loading: boolean = false;

  constructor(
    private router: Router,
    private toastr: ToastrService,
    private api: ApiService,
    private auth: AuthService
  ) {}

  ngOnInit() {
    this.auth.clearToken();
    this.auth.clearUser();
    this.auth.clearLocalStorage();
  }

  onSubmit(form: NgForm) {
    const docType = this.selectedDocument; // 'cpf' or 'passaporte'
    const docValue: string = form.value.documentInput?.replace(/\D/g, '') || '';

    // Validation fields
    if (!docType || !docValue) {
      this.toastr.warning('Por gentileza, preencha todos os campos.', 'Atenção');
      return;
    }

    if (
      (docType === 'cpf' && docValue.length !== 11) ||
      (docType === 'passaporte' && docValue.length !== 11)
    ) {
      this.toastr.warning('Número de documento inválido', 'Atenção');
      return;
    }

    // Call validation face
    this.checkFaceValidation(docValue, this.selectedDocument as 'cpf' | 'passaporte');
    //console.log('docValue:', docValue, 'selectedDocument:', this.selectedDocument);
  }

  checkFaceValidation(docValue: string, docType: 'cpf' | 'passaporte') {
    this.loading = true;

    this.api.getFaceValidation(docValue, docType).subscribe({
      next: (response) => {
        //console.log('Objeto retornado pela API:', response);

        if (response.facialValidada) {
          this.toastr.success('Você já possui facial cadastrada. Redirecionando...', 'Sucesso');

          // globally release the guard
          this.auth.bypassNextNavigation();

          setTimeout(() => this.router.navigate(['/Auth/login']), 800);
        } else {
          this.toastr.warning(
            'Você ainda não tem facial cadastrada ou validada, realize seu cadastro.',
            'Atenção'
          );

          // globally release the guard
          this.auth.bypassNextNavigation();

          setTimeout(() => this.router.navigate(['/RegistrarPessoa']), 800);
        }
      },
      error: () => {
        this.toastr.error('Erro ao validar documento. Tente novamente mais tarde.', 'Erro');
      },
    });
  }
}
