// table.ts

import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, Input } from '@angular/core'; // Removed OnInit and signals
import { FormsModule } from '@angular/forms';
import { Person } from '../../models/person.model';

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

  @Output() actionEvent = new EventEmitter<{ action: string; id: number }>();
  @Output() editPerson = new EventEmitter<number>();
  @Output() deletePerson = new EventEmitter<number>();

  constructor() {}

  onAction(action: string, id: number) {
    this.actionEvent.emit({ action, id });
  }

  onEdit(id: number) {
    this.editPerson.emit(id);
  }

  onDelete(id: number) {
    this.deletePerson.emit(id);
  }
}
