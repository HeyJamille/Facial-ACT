// Bibliotecas
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { EventEmitter, Input, Output } from '@angular/core';

// Components
import { Button } from '../ui/button/button';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-confirmation-modal',
  templateUrl: './confirmation-modal.html',
  standalone: true,
  imports: [CommonModule, Button, FormsModule],
})
export class ConfirmationModal {
  @Input() showModal: boolean = false; // visibilyty of the modal
  @Input() title: string = ''; // Title: Aprovar / Reprovar / Excluir
  @Input() subtitle: string = '';
  @Input() hasCard: boolean = false; // visibilyty of the modal
  @Input() personName: string = '';
  @Input() person: string = '';
  @Input() loading: boolean = false;
  @Input() actionType: 'approve' | 'disapprove' | string | null = null;
  @Input() documentType: string = '';

  @Output() confirm = new EventEmitter<{ validade: string; motivo: string }>();
  @Output() cancel = new EventEmitter<void>();

  // Variáveis locais para os campos
  validade: string = '';
  motivo: string = '';

  constructor(private toastr: ToastrService) {}

  onConfirm() {
    this.loading = true;

    if (
      this.actionType === 'approve' &&
      this.documentType !== 'facial' &&
      this.documentType !== 'documento' &&
      this.hasCard === true
    ) {
      if (!this.validade) {
        this.toastr.error('Selecione a data de validade');
        this.loading = false;
        return;
      }

      const dataDigitada = new Date(this.validade);
      const dataHoje = new Date();

      // Zeramos as horas para comparar apenas os dias (evita erro de segundos/minutos)
      dataHoje.setHours(0, 0, 0, 0);
      dataDigitada.setHours(0, 0, 0, 0);

      // Verifica se a validade é hoje ou no passado
      if (dataDigitada <= dataHoje) {
        this.toastr.error('A data de validade deve ser posterior ao dia de hoje.');
        this.loading = false;
        return;
      }
    }

    if (this.actionType === 'disapprove' && !this.motivo) {
      this.toastr.error(
        'Para reprovar, é necessário descrever o motivo da rejeição de forma clara.',
      );
      this.loading = false;
      return;
    }

    const payloadParaEnviar = {
      validade: this.validade,
      motivo: this.motivo,
    };

    // Se chegou aqui, os dados existem
    this.confirm.emit(payloadParaEnviar);
    //console.log('validade', this.validade);
  }
}
