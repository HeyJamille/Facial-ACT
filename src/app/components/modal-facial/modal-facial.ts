// Bibliotecas
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationModal } from '../confirmation-modal/confirmation-modal';
import { Person } from '../../models/person.model';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from '../../services/api-service/api-service';

@Component({
  selector: 'app-modal-facial',
  imports: [CommonModule, FormsModule, ConfirmationModal],
  templateUrl: './modal-facial.html',
})
export class ModalFacial {
  @Input() imageBase64: string = '';
  @Input() personName: string = '';
  @Input() personID: string = '';
  @Input() person!: Person;

  @Output() close = new EventEmitter<void>();

  showModal = false;
  title = '';
  subtitle = '';
  actionType: 'approve' | 'disapprove' | null = null;

  constructor(private api: ApiService, private toastr: ToastrService) {}

  openModal(type: 'approve' | 'disapprove') {
    this.actionType = type;
    this.showModal = true;

    if (type === 'approve') {
      this.title = 'Aprovar';
      this.subtitle = 'Deseja realmente aprovar';
    } else {
      this.title = 'Desaprovar';
      this.subtitle = 'Deseja realmente desaprovar';
    }
  }

  closeModal() {
    this.close.emit();
  }

  confirmAction() {
    const status = this.actionType === 'approve' ? 'Aprovar' : 'Reprovar';
    console.log(`Pessoa ${status.toLowerCase()}!`);

    const updatedPerson: Person = {
      ...this.person, // copia todos os campos existentes
      statusValidacao: status, // atualiza apenas o status
    };

    this.api.updatePerson(updatedPerson).subscribe({
      next: () => this.toastr.success(`Usuário ${status.toLowerCase()}!`, 'Sucesso'),
      error: () => this.toastr.error(`Erro ao ${status.toLowerCase()} usuário.`, 'Erro'),
    });

    this.showModal = false;
  }
}
