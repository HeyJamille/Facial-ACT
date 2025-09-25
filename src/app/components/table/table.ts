/// Bibliotecas
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationModal } from '../confirmation-modal/confirmation-modal';

export interface Person {
  id: number;
  name: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  cpf: string;
  road: string;
  district: string;
  number: number;
  cep: string;
  city: string;
  state: string;
  edit: string;
  delet: string;
}

@Component({
  selector: 'app-table',
  imports: [CommonModule, FormsModule],
  templateUrl: './table.html',
  standalone: true,
})
export class Table {
  @Input() peopleList: Person[] = []; // Data list

  @Output() editPerson = new EventEmitter<number>();
  @Output() deletePerson = new EventEmitter<number>();

  onEdit(id: number) {
    this.editPerson.emit(id);
  }

  onDelete(id: number) {
    this.deletePerson.emit(id);
  }
}
