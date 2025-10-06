import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-modal-facial',
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-facial.html',
})
export class ModalFacial {
  @Input() imageBase64: string = '';
  @Output() close = new EventEmitter<void>();

  closeModal() {
    this.close.emit();
  }

  ngOnChanges() {
    console.log('Modal recebeu imagemBase64:', this.imageBase64);
  }
}
