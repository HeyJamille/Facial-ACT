import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './signin.html',
})
export class Signin {
  constructor(private router: Router) {}

  onSubmit(form: NgForm) {
    if (form.valid) {
      this.router.navigate(['/registerPeople']);
    } else {
      alert('Por favor, preencha com os seus dados!');
    }
  }
}
