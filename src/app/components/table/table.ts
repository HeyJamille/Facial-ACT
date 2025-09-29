// table.ts

import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, Input } from '@angular/core'; // Removed OnInit and signals
import { FormsModule } from '@angular/forms';
// import { ApiService } from '../../services/api-service/api-service'; // <-- REMOVED
import { Person } from '../../models/person.model';

export interface AuthField {
  name: keyof Person; // Nome da propriedade do objeto
  label: string; // Nome que aparece na coluna
}

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './table.html',
})
export class Table {
  // <-- Removed implements OnInit
  // REMOVED: peopleList, loading, and error signals

  @Input() data: Person[] = []; // Data is received from the parent
  @Input() fields: AuthField[] = [];
  @Input() actions: string[] = [];
  @Input() actionType: 'icons' | 'buttons' = 'icons';
  @Output() actionEvent = new EventEmitter<{ action: string; id: number }>();

  @Output() editPerson = new EventEmitter<number>();
  @Output() deletePerson = new EventEmitter<number>();

  // REMOVED: constructor(private api: ApiService) {}
  constructor() {}

  onAction(action: string, id: number) {
    this.actionEvent.emit({ action, id });
  }

  // REMOVED: ngOnInit() and fetchPeople()

  onEdit(id: number) {
    this.editPerson.emit(id);
  }

  onDelete(id: number) {
    this.deletePerson.emit(id);
  }
}
