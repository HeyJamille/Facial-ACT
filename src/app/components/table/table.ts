// Bibliotecas
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, Input } from '@angular/core'; // Removed OnInit and signals
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

// Models
import { Person } from '../../models/person.model';
import { ModalFacial } from '../modal-facial/modal-facial';

// Services
import { ApiService } from '../../services/api-service/api-service';

import { AuthService } from '../../services/auth-service/auth-service';

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
  imports: [CommonModule, FormsModule, ModalFacial],
  templateUrl: './table.html',
})
export class Table {
  @Input() data: Person[] = []; // Data is received from the parent
  @Input() fields: AuthField[] = [];
  @Input() actions: string[] = [];
  @Input() actionType: 'icons' | 'select' = 'icons';

  @Output() actionEvent = new EventEmitter<{ action: string; id: string }>();
  @Output() editPerson = new EventEmitter<string>();
  @Output() deletePerson = new EventEmitter<string>();

  showFacial = false;
  currentFacialId: string | null = null;
  facialData: { [key: string]: string } = {};

  showDocument = false;
  currentDocumentId?: string;
  documentData: Record<string, string> = {};

  selectedAction: { [key: string]: string } = {};

  constructor(
    private api: ApiService,
    private router: Router,
    private toastr: ToastrService,
    private auth: AuthService
  ) {}

  ngOnChanges() {
    if (this.data?.length) {
      this.data.forEach((person) => {
        if (!this.selectedAction[person.id]) {
          this.selectedAction[person.id] = ''; // show “Selecionar”
        }
      });
    }
  }

  openFacial(personId: string) {
    this.api.getFacialBase64(personId).subscribe({
      next: (res: any) => {
        let base64Str = '';

        // Check if res is base64 object
        if (res && typeof res === 'object' && res.base64) {
          base64Str = res.base64;
        } else if (typeof res === 'string') {
          try {
            const parsed = JSON.parse(res);
            base64Str = parsed.base64;
          } catch (err) {
            console.error('Erro ao parsear JSON da API', err);
          }
        }

        if (!base64Str) {
          this.toastr.error('Nenhuma imagem encontrada', 'Erro');
          return;
        }

        // Remove prefix if exists
        const cleanBase64 = base64Str.replace(/^data:image\/\w+;base64,/, '');
        const byteCharacters = atob(cleanBase64);
        const byteNumbers = new Array(byteCharacters.length)
          .fill(0)
          .map((_, i) => byteCharacters.charCodeAt(i));
        const byteArray = new Uint8Array(byteNumbers);

        // Creates blob and opens in new tab
        const blob = new Blob([byteArray], { type: 'image/png' });
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
      },
      error: () => this.toastr.error('Erro ao carregar a foto facial', 'Erro'),
    });
  }

  async onActionChange(event: Event, person: Person) {
    const value = (event.target as HTMLSelectElement).value;

    if (value === 'visualizar-facial') {
      console.log('Chamando API para pegar facial de', person.id);

      try {
        // Get Token
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

        // Store LocalStorage
        localStorage.setItem(`facial_${person.id}`, data.base64);

        // Read localStorage
        const base64FromStorage = localStorage.getItem(`facial_${person.id}`);
        if (!base64FromStorage) {
          this.toastr.error('Erro ao recuperar a imagem do armazenamento', 'Erro');
          return;
        }

        // Store no objects for internal control (optional)
        this.facialData[person.id] = base64FromStorage;

        // Open the modal
        this.openFacialModal(person.id);
      } catch (err) {
        console.error('Erro ao carregar a captura facial', err);
        this.toastr.error('Erro ao carregar a captura facial', 'Erro');
      }
    }

    if (value === 'visualizar-documento') {
      const token = this.auth.getToken();
      if (!token) {
        this.toastr.error('Usuário não autenticado', 'Erro');
        return;
      }

      this.api.downloadFile(person.id, token).subscribe({
        next: (blob: Blob) => {
          if (!blob) {
            this.toastr.warning('Nenhum documento encontrado.');
            return;
          }

          const extension = blob.type.split('/')[1] || 'pdf';
          const fileName = `documento_${person.id}.${extension}`;

          const link = document.createElement('a');
          const url = window.URL.createObjectURL(blob);
          link.href = url;
          link.download = fileName;
          link.click();
          window.URL.revokeObjectURL(url);

          this.toastr.success('Baixando documento!');
        },
        error: (err) => {
          console.error('Erro ao baixar documento:', err);
          this.toastr.error('Erro ao baixar documento.');
        },
      });
    }

    // Reset select
    this.selectedAction[person.id] = '';
  }

  // Optional function for icons
  onAction(action: string, id: string) {
    this.actionEvent.emit({ action, id });
  }

  onEdit(id: string) {
    this.editPerson.emit(id);
  }

  onDelete(id: string) {
    this.deletePerson.emit(id);
  }

  approveFacial(personId: string) {
    console.log('Aprovando facial de:', personId);
  }

  disapproveFacial(personId: string) {
    console.log('Reprovando facial de:', personId);
  }

  openFacialModal(personId: string) {
    console.log('Abrindo modal para pessoa:', personId);
    this.currentFacialId = personId;
    this.showFacial = true;
  }

  openDocumentModal(personId: string) {
    this.currentDocumentId = personId;
    this.showDocument = true;
  }

  maskId(value: string | null | undefined, fieldName?: string): string {
    if (!value) return '';

    const raw = String(value).replace(/\D/g, ''); // remove all it is not number

    // if has 11 number -> CPF
    if (raw.length === 11) {
      const first = raw.slice(0, 3);
      const last = raw.slice(-2);
      return `${first}.***.***-${last}`;
    }

    // If not -> passport
    const first = value.slice(0, 2);
    const last = value.slice(-2);
    const stars = '*'.repeat(Math.max(3, value.length - 4));
    return `${first}${stars}${last}`;
  }
}
