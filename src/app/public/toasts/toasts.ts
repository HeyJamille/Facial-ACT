import { Component } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-toasts',
  imports: [MatCardModule, MatButtonModule],
  templateUrl: './toasts.html',
})
export class Toasts {
  constructor(private toastr: ToastrService) {}

  showSuccess() {
    this.toastr.success('TOAST FUNCIONANDO', 'Sucesso!');
  }
}
