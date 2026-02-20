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

  documentType: 'facial' = 'facial';
  showModal = false;
  title = '';
  subtitle = '';
  actionType: 'approve' | 'disapprove' | null = null;

  constructor(
    private api: ApiService,
    private toastr: ToastrService,
  ) {}

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
        motivoRejeicao: '',
      };
    } else {
      payload = {
        aprovado: false,
        motivoRejeicao: event.motivo,
      };
    }

    //console.log('Payload final para API:', payload);
    //console.log('personID', this.personID);
    //console.log('personName', this.personName);
    //console.log('person', this.person);

    //console.log('payload', payload);

    // 2. Passamos 'payload' (sem o 'this', pois é uma variável local da função)
    this.api.approvarOrDesapproveFacial(this.personID, payload).subscribe({
      next: (res) => {
        this.toastr.success(
          `Facial do usuário ${isApprove ? 'aprovada' : 'reprovada'} com sucesso!`,
        );

        if (!isApprove) {
          this.person.statusFacial = 'Facial Rejeitada';
        } else {
          this.person.statusFacial = 'Facial Aprovada';
        }

        const integrationData = {
          facialIntegrada: isApprove ? 'S' : 'N',
          integracaoOcorrencia: isApprove
            ? 'Facial integrada com sucesso'
            : payload.motivoRejeicao || 'Rejeitado',
        };

        // 3. Chamada ao updateIntegration passando o ID e o objeto de dados
        this.api.updateIntegration(this.personID, integrationData).subscribe({
          next: () => {
            //console.log('Integração atualizada com sucesso');
          },
          error: (err) => console.error('Erro ao atualizar integração:', err),
        });

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
