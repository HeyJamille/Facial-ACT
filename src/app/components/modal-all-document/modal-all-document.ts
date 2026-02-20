// Bibliotecas
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationModal } from '../confirmation-modal/confirmation-modal';
import { Person } from '../../models/person.model';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from '../../services/api-service/api-service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { catchError, forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-modal-all-document',
  imports: [CommonModule, FormsModule, ConfirmationModal],
  templateUrl: './modal-all-document.html',
})
export class ModalAllDocument {
  @Input() isPdf: boolean = false;

  // As outras que você já deve ter:
  @Input() arquivoUrl: string | null = null;
  //@Input() person: Person | null = null;
  //@Input() person!: Person;
  //@Input() person!: Person;
  @Input() arquivosTodos: any;
  @Output() close = new EventEmitter<void>();

  @Input() person: any;

  ladoDoc: 'frente' | 'verso' = 'frente';
  ladoCard: 'frente' | 'verso' = 'frente';

  // Estados de Zoom
  zoomDoc = false;
  zoomCard = false;

  showModal = false;
  title = '';
  subtitle = '';
  actionType: 'approve' | 'disapprove' | null = null;

  constructor(
    private api: ApiService,
    private toastr: ToastrService,
    private sanitizer: DomSanitizer,
  ) {}

  temCarteirinha: boolean = false; // Crie esta variável aqui

  openModal(type: 'approve' | 'disapprove') {
    this.actionType = type;
    this.showModal = true;

    // Atualiza a variável da classe
    this.temCarteirinha = !!this.arquivosTodos?.urlCardFrente;
    console.log('TEm carteira?', this.temCarteirinha);
    if (type === 'approve') {
      this.title = 'Aprovar';
      if (this.temCarteirinha) {
        this.subtitle = 'Digite a data de validade da carteirinha de';
      } else {
        this.subtitle = 'Deseja realmente aprovar o documento de';
      }
    } else {
      this.title = 'Desaprovar';
      this.subtitle = 'Escreva o motivo para desaprovar o documento de';
    }
  }

  closeModal() {
    this.close.emit();
  }

  confirmAction(event: any) {
    const isApprove = this.actionType === 'approve';

    const payloadCard = {
      aprovado: isApprove,
      validade: isApprove ? event.validade : '',
      motivoRejeicao: isApprove ? '' : event.motivo,
    };
    const payloadDoc = { aprovado: isApprove, motivoRejeicao: isApprove ? '' : event.motivo };
    const payloadFacial = { aprovado: isApprove, motivoRejeicao: isApprove ? '' : event.motivo };

    const chamadas = {
      card: this.api
        .approvarOrDesapproveCard(this.person.id, payloadCard)
        .pipe(catchError(() => of({ error: true }))),
      doc: this.api
        .approvarOrDesapproveDocument(this.person.id, payloadDoc)
        .pipe(catchError(() => of({ error: true }))),
      facial: this.api
        .approvarOrDesapproveFacial(this.person.id, payloadFacial)
        .pipe(catchError(() => of({ error: true }))),
    };

    forkJoin(chamadas).subscribe({
      next: (res: any) => {
        // 1. Verificamos se houve pelo menos um sucesso para dar o feedback positivo
        const houveSucesso = !res.card?.error || !res.doc?.error || !res.facial?.error;

        if (houveSucesso) {
          // 2. Só alteramos o status local se a chamada específica NÃO tiver o objeto de erro

          // Status Carteirinha
          if (!res.card?.error) {
            this.person.statusCarteirinha = isApprove
              ? 'Carteirinha Aprovada'
              : 'Carteirinha Rejeitada';
          }

          // Status Documento
          if (!res.doc?.error) {
            this.person.statusDocumento = isApprove ? 'Documento Aprovado' : 'Documento Rejeitado';
          }

          // Status Facial
          if (!res.facial?.error) {
            this.person.statusFacial = isApprove ? 'Facial Aprovada' : 'Facial Rejeitada';
          }

          this.toastr.success(`Documentos aprovados com sucesso!.`);
          this.showModal = false;
          this.close.emit();
        } else {
          this.toastr.error('Todas as tentativas falharam. Tente novamente.');
        }
      },
      error: (err) => {
        this.toastr.error('Erro crítico ao conectar com o servidor.');
      },
    });
  }

  // Este método diz ao Angular que a URL do Blob é segura
  getSafeUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
