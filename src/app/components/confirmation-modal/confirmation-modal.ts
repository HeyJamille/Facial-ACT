import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { EventEmitter, Input, Output } from '@angular/core';
import { Button } from '../ui/button/button';

@Component({
  selector: 'app-confirmation-modal',
  templateUrl: './confirmation-modal.html',
  standalone: true,
  imports: [CommonModule, Button],
})
export class ConfirmationModal {
  @Input() showModal: boolean = false; // controla visibilidade
  @Input() title: string = ''; // Title: Aprovar / Reprovar / Excluir
  @Input() subtitle: string = '';
  @Input() personName: string = '';
  @Input() loading: boolean = false;

  @Output() confirm = new EventEmitter<void>(); // Evento quando clicar em confirmar
  @Output() cancel = new EventEmitter<void>(); // Evento quando clicar em cancelar
}
