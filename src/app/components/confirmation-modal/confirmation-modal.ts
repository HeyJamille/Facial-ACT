import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { EventEmitter, Input, Output } from '@angular/core';
import { Button } from '../ui/button/button';

@Component({
  selector: 'app-confirmation-modal',
  imports: [CommonModule, Button],
  templateUrl: './confirmation-modal.html',
})
export class ConfirmationModal {
  @Input() showModal = false;
  @Input() peopleForDeletName: string | null = null;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}
