// Bibliotecas
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { EventEmitter, Input, Output } from '@angular/core';

// Components
import { Button } from '../ui/button/button';

@Component({
  selector: 'app-confirmation-modal',
  templateUrl: './confirmation-modal.html',
  standalone: true,
  imports: [CommonModule, Button],
})
export class ConfirmationModal {
  @Input() showModal: boolean = false; // visibilyty of the modal
  @Input() title: string = ''; // Title: Aprovar / Reprovar / Excluir
  @Input() subtitle: string = '';
  @Input() personName: string = '';
  @Input() loading: boolean = false;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}
