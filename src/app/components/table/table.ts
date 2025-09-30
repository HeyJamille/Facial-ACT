import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, Input } from '@angular/core'; // Removed OnInit and signals
import { FormsModule } from '@angular/forms';
import { Person } from '../../models/person.model';
import { ApiService } from '../../services/api-service/api-service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

export interface AuthField {
  name: keyof Person;
  label: string;
}

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './table.html',
})
export class Table {
  @Input() data: Person[] = []; // Data is received from the parent
  @Input() fields: AuthField[] = [];
  @Input() actions: string[] = [];
  @Input() actionType: 'icons' | 'buttons' = 'icons';

  @Output() actionEvent = new EventEmitter<{ action: string; id: string }>();
  @Output() editPerson = new EventEmitter<string>();
  @Output() deletePerson = new EventEmitter<string>();

  constructor(private api: ApiService, private router: Router, private toastr: ToastrService) {}

  onAction(action: string, id: string) {
    this.actionEvent.emit({ action, id });
  }

  onEdit(id: string) {
    this.editPerson.emit(id);
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
}
