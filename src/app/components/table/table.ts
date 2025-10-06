import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, Input } from '@angular/core'; // Removed OnInit and signals
import { FormsModule } from '@angular/forms';
import { Person } from '../../models/person.model';
import { ApiService } from '../../services/api-service/api-service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { ModalFacial } from '../modal-facial/modal-facial';
import { AuthService } from '../../services/auth-service/auth-service';

export interface AuthField {
  name: keyof Person;
  label: string;
}

export interface Table {
  id: number;
  name: string;
  // outras propriedades...
  showFacialModal?: boolean; // "?" significa que é opcional
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

  // Mantém o estado de qual captura facial mostrar
  showFacial = false;
  currentFacialId: string | null = null;
  facialData: { [key: string]: string } = {};

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

  onDelete(id: string) {
    this.deletePerson.emit(id);
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
        // Pega o token do AuthService
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

        // Armazena no localStorage
        localStorage.setItem(`facial_${person.id}`, data.base64);

        // Lê do localStorage
        const base64FromStorage = localStorage.getItem(`facial_${person.id}`);
        if (!base64FromStorage) {
          this.toastr.error('Erro ao recuperar a imagem do armazenamento', 'Erro');
          return;
        }

        // Guarda no objeto para controle interno (opcional)
        this.facialData[person.id] = base64FromStorage;

        // Abre o modal
        this.openFacialModal(person.id);
      } catch (err) {
        console.error('Erro ao carregar a captura facial', err);
        this.toastr.error('Erro ao carregar a captura facial', 'Erro');
      }
    }

    if (value === 'visualizar-documento') {
      console.log('Visualizar documento de', person.id);
    }

    // Reset select
    this.selectedAction[person.id] = '';
  }

  // Função opcional para ícones
  onAction(action: string, id: string) {
    this.actionEvent.emit({ action, id });
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
}
