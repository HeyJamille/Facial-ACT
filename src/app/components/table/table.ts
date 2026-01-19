// Bibliotecas
import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Output,
  Input,
  ChangeDetectorRef,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

// Models
import { Person } from '../../models/person.model';
import { ModalFacial } from '../modal-facial/modal-facial';

// Services
import { ApiService } from '../../services/api-service/api-service';
import { AuthService } from '../../services/auth-service/auth-service';
import { UtilsService } from '../../utils/utils-service';
import { ModalDocument } from '../modal-document/modal-document';
import { forkJoin } from 'rxjs';
import { ModalAllDocument } from '../modal-all-document/modal-all-document';
import { ModalCard } from '../modal-card/modal-card';

export interface AuthField {
  name: keyof Person;
  label: string;
}

export interface Table {
  id: number;
  name: string;
  showFacialModal?: boolean;
}

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalFacial, ModalDocument, ModalAllDocument, ModalCard],
  templateUrl: './table.html',
})
export class Table {
  @Input() data: Person[] = [];
  @Input() fields: AuthField[] = [];
  @Input() actions: string[] = [];
  @Input() actionType: 'icons' | 'select' | 'check' = 'icons';

  @Output() actionEvent = new EventEmitter<{ action: string; id: string }>();
  @Output() editPerson = new EventEmitter<string>();
  @Output() deletePerson = new EventEmitter<string>();

  currentPersonName: string = '';
  showFacial = false;
  currentFacialId: string | null = null;
  facialData: { [key: string]: string } = {};

  currentDocumentId?: string;
  documentData: Record<string, string> = {};

  currentCardId?: string;
  cardData: Record<string, string> = {};

  showDocument = false;
  showCard = false;

  selectedAction: { [key: string]: string } = {};
  arquivoUrl: string | null = null;
  isPdf: boolean = false;
  selectPerson: Person | null = null;

  showModalAllDocument = false;
  arquivosTodos = {
    facial: '' as string | null,
    documentoUrl: '' as string | null,
    carteirinhaUrl: '' as string | null,
    isDocumentoPdf: false,
    isCarteirinhaPdf: false,
  };

  resultados: any[] = [];
  pollingInterval: any;

  constructor(
    private api: ApiService,
    private router: Router,
    private toastr: ToastrService,
    private auth: AuthService,
    public utils: UtilsService,
    private cdr: ChangeDetectorRef, // Adicione o ChangeDetectorRef
  ) {}

  ngOnChanges() {
    if (this.data?.length) {
      this.verificarDocumentos();

      this.data.forEach((person) => {
        if (!this.selectedAction[person.id]) {
          this.selectedAction[person.id] = '';
        }
      });
    }
  }

  async onActionChange(event: Event, person: Person) {
    const value = (event.target as HTMLSelectElement).value;

    if (value === 'visualizar-facial') {
      try {
        this.selectPerson = person;
        const token = this.auth.getToken();

        if (!token) {
          this.toastr.error('Usuário não autenticado', 'Erro');
          return;
        }

        const data = await this.api.fetchFacialBase64(person.id, token);

        if (!data?.base64) {
          this.toastr.error('Nenhuma imagem encontrada', 'Erro');
          return;
        }

        // REMOVE QUALQUER CAPTURA FACIAL ANTERIOR
        Object.keys(localStorage)
          .filter((key) => key.startsWith('facial_'))
          .forEach((key) => localStorage.removeItem(key));

        // SALVA SOMENTE A ATUAL
        localStorage.setItem(`facial_${person.id}`, data.base64);

        this.facialData[person.id] = data.base64;
        this.openFacialModal(person.id, person.nomeCompleto);
      } catch (err) {
        console.error('Erro ao carregar a captura facial', err);
        this.toastr.error('Erro ao carregar a captura facial', 'Erro');
      }
    }

    if (value === 'visualizar-documento') {
      const token = this.auth.getToken();
      this.selectPerson = person;

      if (!token) {
        this.toastr.error('Usuário não autenticado', 'Erro');
        return;
      }

      const tipoArquivo = 'documento';

      this.api.downloadFile(person.id, token, tipoArquivo).subscribe({
        next: (blob: Blob) => {
          if (!blob) {
            this.toastr.warning('Nenhum documento encontrado.');
            return;
          }

          this.isPdf = blob.type === 'application/pdf';
          if (this.arquivoUrl) URL.revokeObjectURL(this.arquivoUrl);
          this.arquivoUrl = URL.createObjectURL(blob);
          //this.showDocument = true;
          this.openDocumentModal(person.id);
        },
        error: (err) => {
          this.toastr.error('Nenhum documento encontrado.');
        },
      });
    }

    if (value === 'visualizar-carteirinha') {
      const token = this.auth.getToken();
      this.selectPerson = person;

      if (!token) {
        this.toastr.error('Usuário não autenticado', 'Erro');
        return;
      }

      const tipoArquivo = 'carteirinha';

      this.api.downloadFile(person.id, token, tipoArquivo).subscribe({
        next: (blob: Blob) => {
          if (!blob) {
            this.toastr.warning('Nenhuma carteirinha encontrado.');
            return;
          }

          this.isPdf = blob.type === 'application/pdf';
          if (this.arquivoUrl) URL.revokeObjectURL(this.arquivoUrl);
          this.arquivoUrl = URL.createObjectURL(blob);
          //this.showCard = true;
          this.openCardModal(person.id);
        },
        error: (err) => {
          this.toastr.error('Nenhuma carteirinha encontrada.');
        },
      });
    }
  }

  onAction(action: string, id: string) {
    this.actionEvent.emit({ action, id });
  }

  onEdit(id: string) {
    this.editPerson.emit(id);
  }

  onDelete(id: string) {
    this.deletePerson.emit(id);
  }

  openFacialModal(personId: string, personName: string) {
    this.currentFacialId = personId;
    this.currentPersonName = personName;
    this.showFacial = true;
  }

  openDocumentModal(personId: string) {
    this.currentDocumentId = personId;
    this.showDocument = true;
  }

  openCardModal(personId: string) {
    this.currentCardId = personId;
    this.showCard = true;
  }

  verificarDocumentos() {
    this.data.forEach((person) => {
      this.api.getApproveByCPF(person).subscribe({
        next: (response) => {
          //console.log('response', response);
          // Atualizamos a referência da pessoa diretamente no array 'data'
          // Certifique-se de que os nomes dos campos (facial, arquivoDocumento, etc)
          // coincidem com o que a sua API retorna.

          person.iconFacial = response.iconFacial;
          person.iconDocumento = response.iconDocumento;
          person.iconCarteirinha = response.iconCarteirinha;

          person.statusFacial = response.statusFacial; // Esperado 'S' ou 'N' conforme seu HTML
          person.statusDocumento = response.statusDocumento; // Ajuste conforme o retorno da API
          person.statusCarteirinha = response.statusCarteirinha; // Esperado boolean

          //console.log(`Dados atualizados para ${person.nomeCompleto}:`, response);
        },
        error: (err) => {
          console.error('Erro ao consultar pessoa');
        },
      });
    });
  }

  // Método para fechar qualquer modal e resetar o select da pessoa
  fecharModais() {
    if (this.selectPerson) {
      // Primeiro limpamos o visual do select
      this.selectedAction[this.selectPerson.id] = '';
    }

    // Depois fechamos as flags de controle
    this.showFacial = false;
    this.showDocument = false;
    this.showCard = false;
    this.showModalAllDocument = false;

    // Por último limpamos a referência da pessoa
    this.selectPerson = null;

    // Força o Angular a atualizar a tela
    this.cdr.detectChanges();
  }
}
