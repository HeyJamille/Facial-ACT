// Bibliotecas
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

// Components
import { Button } from '../ui/button/button';

// Service
import { ApiService } from '../../services/api-service/api-service';
import { Person } from '../../models/person.model';

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

  person: Person = {} as Person;

  constructor(private toastr: ToastrService, private api: ApiService) {}

  onSubmit(form: NgForm) {
    this.loading = true;
    const email = this.person.email;

    this.api.recoverPwd(email).subscribe({
      next: (res) => {
        this.toastr.success(
          'Uma senha temporária foi enviada para o seu e-mail! Acesse o sistema com a nova senha e faça a mudança.',
          'Sucesso',
          {
            timeOut: 10000,
            progressBar: true,
            tapToDismiss: true,
          }
        );

        this.loading = false;
        form.resetForm();
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Erro ao enviar e-mail.', 'Erro');
        this.loading = false;
      },
    });
  }
}
