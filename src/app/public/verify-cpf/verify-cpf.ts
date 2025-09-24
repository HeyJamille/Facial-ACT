import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { NgxMaskDirective } from 'ngx-mask';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-verify-cpf',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxMaskDirective],
  templateUrl: './verify-cpf.html',
})
export class VerifyCPF {
  constructor(private router: Router, private toastr: ToastrService) {}

  onSubmit(form: NgForm) {
    if (!form.valid) {
      this.toastr.warning('Preencha o campo de CPF!', 'Atenção');
      return;
    }

    const cpf = form.value.cpf.replace(/\D/g, ''); // limpa possíveis pontos ou traços

    if (cpf === '06471394306') {
      this.toastr.success('Você já possui facial cadastrada', 'Sucesso');
      form.reset();
    } else {
      this.toastr.error('Você ainda não tem facial cadastrada', 'Erro');
      setTimeout(() => {
        this.router.navigate(['/facial-registration']);
      }, 800);
    }
  }
}
