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
import { UtilsService } from '../../../utils/utils-service';

export interface FaceValidationResponse {
  facialValidada: boolean;
  existe: boolean;
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
    private auth: AuthService,
    private utils: UtilsService,
  ) {}

  ngOnInit() {
    this.auth.clearToken();
    this.auth.clearUser();
    this.auth.clearLocalStorage();
  }

  onSubmit(form: NgForm) {
    const docType = this.selectedDocument; // 'cpf' ou 'passaporte'
    let docValue: string = form.value.documentInput || '';

    // Validação dos campos
    if (!docType || !docValue) {
      this.toastr.warning('Por gentileza, preencha todos os campos.', 'Atenção');
      return;
    }

    if (docType === 'cpf') {
      // Apenas números para CPF
      docValue = docValue.replace(/\D/g, '');

      if (docValue.length !== 11) {
        this.toastr.warning('CPF deve ter 11 dígitos.', 'Atenção');
        return;
      }

      if (!this.utils.validaCPF(docValue)) {
        this.toastr.error('CPF inválido. Verifique e tente novamente.', 'Erro');
        return;
      }
    } else if (docType === 'passaporte') {
      // Letras e números para passaporte (sem alteração)
      const passaporteRegex = /^[A-Za-z]{2}\d{6}$/;

      if (!passaporteRegex.test(docValue)) {
        this.toastr.warning('Passaporte deve conter letras e números.', 'Atenção');
        return;
      }

      if (docValue.length < 6 || docValue.length > 11) {
        this.toastr.warning('Número de passaporte deve ter entre 6 e 11 caracteres.', 'Atenção');
        return;
      }
    } else {
      this.toastr.warning('Tipo de documento inválido.', 'Atenção');
      return;
    }

    // Salvar no localStorage
    localStorage.setItem('docType', docType);
    localStorage.setItem('docValue', docValue);

    // Navegar para a página de registro
    this.router.navigate(['/RegistrarPessoa']);

    //console.log('doctype:', docType);
    //console.log('docValue:', docValue);

    // Chamada de validação facial
    this.checkFaceValidation(docValue, docType as 'cpf' | 'passaporte');
  }

  checkFaceValidation(docValue: string, docType: 'cpf' | 'passaporte') {
    this.loading = true;

    this.api.getFaceValidation(docValue, docType).subscribe({
      next: (response) => {
        //console.log('Objeto retornado pela API:', response);

        if (response.facialValidada || response.existe === true) {
          this.toastr.success('Você já possui cadastro. Redirecionando...', 'Sucesso');

          // globally release the guard
          this.auth.bypassNextNavigation();

          setTimeout(() => this.router.navigate(['/Auth/login']), 800);
        } else {
          this.toastr.warning(
            'Você ainda não tem facial cadastrada ou validada, realize seu cadastro.',
            'Atenção',
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
