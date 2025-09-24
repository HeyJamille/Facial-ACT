import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './signin.html',
})
export class Signin {
  constructor(private router: Router, private toastr: ToastrService) {}

  onSubmit(form: NgForm) {
    if (!form.valid) {
      this.toastr.warning('Preencha corretamente todos os dados!', 'Atenção');
      return;
    }

    this.toastr.success('Login realizado com sucesso! Redirecionando...', 'Sucesso');
    setTimeout(() => {
      this.router.navigate(['/registerPeople']);
    }, 500);
  }
}
