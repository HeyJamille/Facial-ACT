// Bibliotecas
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, Pipe } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationModal } from '../confirmation-modal/confirmation-modal';
import { Person } from '../../models/person.model';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from '../../services/api-service/api-service';
import { SafeUrlPipe } from '../../services/safeUrlPipe';

@Component({
  selector: 'app-modal-document',
  imports: [CommonModule, FormsModule, SafeUrlPipe, ConfirmationModal],
  templateUrl: './modal-document.html',
})
export class ModalDocument {
  @Input() isPdf: boolean = false;

  // As outras que você já deve ter:
  @Input() arquivoUrl: string | null = null;
  //@Input() person: Person | null = null;
  @Input() person!: Person;
  //@Input() person!: Person;

  @Output() close = new EventEmitter<void>();

  showModal = false;
  title = '';
  subtitle = '';
  actionType: 'approve' | 'disapprove' | null = null;

  constructor(
    private api: ApiService,
    private toastr: ToastrService,
  ) {}

  isZoomed = false;

  toggleZoom() {
    this.isZoomed = !this.isZoomed;
  }

  openModal(type: 'approve' | 'disapprove') {
    this.actionType = type;
    this.showModal = true;

    if (type === 'approve') {
      this.title = 'Aprovar';
      this.subtitle = 'Digite a data de validade do documento de';
    } else {
      this.title = 'Desaprovar';
      this.subtitle = 'Escreva o motivo para desaprovar o documento de';
    }
  }

  closeModal() {
    this.close.emit();
  }

  confirmAction(event: any) {
    console.log('Dados vindos do modal:', event);

    const isApprove = this.actionType === 'approve';
    console.log('isApprove:', isApprove);

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
        validade: '',
        motivoRejeicao: event.motivo,
      };
    }

    console.log('Payload final para API:', payload);
    console.log('personID', this.person.id);
    // 2. Passamos 'payload' (sem o 'this', pois é uma variável local da função)
    this.api.approvarOrDesapproveDocument(this.person.id, payload).subscribe({
      next: (res) => {
        this.toastr.success(
          `Documento do usuário ${isApprove ? 'aprovado' : 'reprovado'} com sucesso!`,
        );

        if (!isApprove) {
          this.person.statusDocumento = 'Rejeitado';
        } else {
          this.person.statusDocumento = 'Aprovado';
        }
        /* Se foi desaprovado, deletar o documento
        if (!isApprove) {
          const bodyData = {
            facial: false,
            documento: true,
            carteirinha: false,
          };

          this.api.deleteDocument(this.person.id, bodyData).subscribe({
            next: () => {
              console.log('Documento deletado com sucesso!');
              // Atualiza frontend
              //this.person.arquivoDocumento = '';
              this.person.statusDocumento = 'Rejeitado';
            },
            error: (err) => {
              console.error('Erro ao deletar documento rejeitado:', err);
              this.toastr.error('Erro ao deletar documento rejeitado.');
            },
          });
        }
        */

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
