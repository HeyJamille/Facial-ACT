import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { NgxMaskDirective } from 'ngx-mask';
import { ToastrService } from 'ngx-toastr';
import { Button } from '../../components/ui/button/button';

@Component({
  selector: 'app-verify-cpf',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxMaskDirective, Button],
  templateUrl: './verify-cpf.html',
})
export class VerifyCPF {
  selectedDocument: string = '';

  constructor(private router: Router, private toastr: ToastrService) {}

  onSubmit(form: NgForm) {
    const docType = this.selectedDocument; // 'cpf' ou 'cnh'
    const docValue: string = form.value.documentInput?.replace(/\D/g, '') || '';

    // Field Validation
    if (!docType || !docValue) {
      this.toastr.warning('Por gentileza, preencha todos os campos.', 'Atenção');
      return;
    }

    if (
      (docType === 'cpf' && docValue.length !== 11) ||
      (docType === 'cnh' && docValue.length !== 11)
    ) {
      this.toastr.warning('Número de documento inválido', 'Atenção');
      return;
    }

    // Documents registed
    const registeredDocs: Record<string, string> = {
      cpf: '06471394306',
      cnh: '12345678900',
    };

    if (registeredDocs[docType] === docValue) {
      this.toastr.success('Você já possui facial cadastrada', 'Sucesso');
      setTimeout(() => this.router.navigate(['/Auth/login']), 800);
    } else {
      this.toastr.error('Você ainda não tem facial cadastrada', 'Erro');
      setTimeout(() => this.router.navigate(['/registerPeople']), 800);
    }
  }
}
