import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Button } from '../ui/button/button';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-recover-pwd',
  imports: [CommonModule, FormsModule, Button],
  templateUrl: './recover-pwd.html',
  standalone: true,
})
export class RecoverPwd {
  @Input() showModal = false;
  @Output() close = new EventEmitter<void>();

  onClose() {
    this.close.emit(); // send father event
  }

  email: string = '';
  loading: boolean = false;

  constructor(private toastr: ToastrService) {}

  onSubmit(form: NgForm) {
    if (form.invalid) {
      this.toastr.error('Preencha o e-mail corretamente!', 'Erro');
      return;
    }

    this.loading = true;

    try {
      // Simulate shipping
      this.sendEmail(this.email);

      this.toastr.success('E-mail enviado com sucesso!');
      this.loading = false;
      form.resetForm();
    } catch (err) {
      this.toastr.error('Erro ao enviar e-mail.', 'Erro');
      this.loading = false;
    }
  }

  // Função simulando API de forma síncrona
  sendEmail(email: string) {
    console.log('E-mail enviado para', email);
  }
}
