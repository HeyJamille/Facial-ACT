// Bibliotecas
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationModal } from '../confirmation-modal/confirmation-modal';
import { Person } from '../../models/person.model';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from '../../services/api-service/api-service';
import { SafeUrlPipe } from '../../services/safeUrlPipe';

@Component({
  selector: 'app-modal-card',
  imports: [CommonModule, FormsModule, ConfirmationModal, SafeUrlPipe],
  templateUrl: './modal-card.html',
})
export class ModalCard {
  @Input() isPdf: boolean = false;

  // As outras que você já deve ter:
  @Input() arquivoUrl: string | null = null;
  @Input() personName: string = '';
  @Input() personID: string = '';
  @Input() person!: Person;

  @Output() success = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  showModal = false;
  title = '';
  subtitle = '';
  actionType: 'approve' | 'disapprove' | null = null;

  constructor(private api: ApiService, private toastr: ToastrService) {}

  isZoomed = false;

  toggleZoom() {
    this.isZoomed = !this.isZoomed;
  }

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

  confirmAction(event: any) {
    //console.log('Dados vindos do modal:', event);

    const isApprove = this.actionType === 'approve';
    //console.log('isApprove:', isApprove);

    // 1. Criamos a variável fora do if/else para que ela seja acessível depois
    let payload: any;

    if (isApprove) {
      payload = {
        aprovado: true,
        validade: event.validade,
        motivoRejeicao: '',
      };
    } else {
      payload = {
        aprovado: false,
        motivoRejeicao: event.motivo,
      };
    }

    //console.log('Payload final para API:', payload);
    //console.log('personID', this.person.id);
    // 2. Passamos 'payload' (sem o 'this', pois é uma variável local da função)
    this.api.approvarOrDesapproveCard(this.person.id, payload).subscribe({
      next: (res) => {
        this.toastr.success(
          `Carteirinha do usuário ${isApprove ? 'aprovada' : 'reprovada'} com sucesso!`
        );

        if (!isApprove) {
          this.person.statusCarteirinha = 'Rejeitado';
        } else {
          this.person.statusCarteirinha = 'Aprovado';
        }

        this.showModal = false;
        // Se quiser fechar o modal de visualização do documento:
        this.close.emit();
      },
      error: (err) => {
        const backendMessage =
          err?.error?.message ||
          JSON.stringify(err?.error) ||
          'Erro desconhecido, contate o suporte.';

        this.toastr.error(backendMessage);
      },
    });
  }
}
