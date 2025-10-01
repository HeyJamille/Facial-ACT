import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { NgxMaskDirective } from 'ngx-mask';
import { ToastrService } from 'ngx-toastr';
import { Button } from '../../components/ui/button/button';
import { catchError, of } from 'rxjs';
import { ApiService } from '../../services/api-service/api-service';
import { AuthGuard } from '../../guards/auth-guard';
import { AuthService } from '../../services/auth-service/auth-service';

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
    console.log('docValue:', docValue, 'selectedDocument:', this.selectedDocument);
  }

  checkFaceValidation(docValue: string, docType: 'cpf' | 'passaporte') {
    this.loading = true;

    this.api.getFaceValidation(docValue, docType).subscribe({
      next: (response: FaceValidationResponse) => {
        this.loading = false;

        if (response.facialValidada) {
          this.toastr.success('Documento encontrado. Você já possui facial cadastrada', 'Sucesso');
          setTimeout(() => this.router.navigate(['/Auth/login']), 800);
        } else {
          this.toastr.warning(
            'Documento não encontrado. Você ainda não tem facial cadastrada',
            'Atenção'
          );
          setTimeout(() => this.router.navigate(['/registerPeople']), 800);
        }
      },
      error: () => {
        this.loading = false;
        this.toastr.error('Erro ao validar documento. Tente novamente mais tarde.', 'Erro');
      },
    });
  }
}
