import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { Table } from '../../components/table/table';
import { ConfirmationModal } from '../../components/confirmation-modal/confirmation-modal';
import { Person } from '../../models/person.model';
import { Header } from '../../components/header/header';

@Component({
  selector: 'app-list-people',
  standalone: true,
  imports: [CommonModule, FormsModule, Table, ConfirmationModal, Header],
  templateUrl: './list-people.html',
})
export class ListPeople {
  showModal = false;
  peopleForDeletId: number | null = null;
  peopleForDeletName: string = '';
  peopleList: Person[] = []; // receber via Table Output se quiser sincronizar

  constructor(private router: Router, private toastr: ToastrService) {}

  deletePerson(id: number) {
    const pessoa = this.peopleList.find((p) => p.id === id);
    if (pessoa) {
      this.peopleForDeletId = id;
      this.peopleForDeletName = pessoa.nomeCompleto;
      this.showModal = true;
    }
  }

  confirmDeletion() {
    if (this.peopleForDeletId !== null) {
      this.peopleList = this.peopleList.filter((p) => p.id !== this.peopleForDeletId);
      this.peopleForDeletId = null;
      this.peopleForDeletName = '';
      this.showModal = false;
    }
  }

  cancelDeletion() {
    this.peopleForDeletId = null;
    this.peopleForDeletName = '';
    this.showModal = false;
  }

  editPerson(id: number) {
    const person = this.peopleList.find((p) => p.id === id);
    if (person) {
      this.toastr.success('Redirecionando para edição', 'Sucesso');
      setTimeout(() => {
        this.router.navigate(['/registerPeople'], { state: { person } });
      }, 500);
    }
  }
}
