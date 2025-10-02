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
  @Input() peopleForDeletId: string = '';
  @Input() peopleForDeletName: string = '';
  @Input() title = 'Confirmação';
  @Input() subtitle = 'Deseja realmente executar a ação?'; // <- precisa existir

  // Recebe a ação: 'aprovar', 'reprovar', 'deletar'
  @Input() actionType: 'aprovar' | 'reprovar' | 'deletar' = 'deletar';

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  /*
  get title(): string {
    switch (this.actionType) {
      case 'aprovar':
        return 'Confirmar Aprovação';
      case 'reprovar':
        return 'Confirmar Reprovação';
      case 'deletar':
        return 'Confirmar Exclusão';
      default:
        return 'Confirmação';
    }
  }

  get subtitle(): string {
    switch (this.actionType) {
      case 'aprovar':
        return 'Deseja realmente aprovar o usuário';
      case 'reprovar':
        return 'Deseja realmente reprovar o usuário';
      case 'deletar':
        return 'Deseja realmente excluir o usuário';
      default:
        return 'Deseja realmente executar a ação';
    }
  }
  */
  onConfirm() {
    this.confirm.emit();
  }

  onCancel() {
    this.cancel.emit();
  }
}
