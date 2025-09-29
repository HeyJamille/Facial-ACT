// listpeople.ts

import { Component, OnInit } from '@angular/core'; // <-- 1. Importar OnInit
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { Table } from '../../components/table/table';
import { ConfirmationModal } from '../../components/confirmation-modal/confirmation-modal';
import { Person } from '../../models/person.model';
import { Header } from '../../components/header/header';
import { ApiService } from '../../services/api-service/api-service'; // <-- 2. Importar ApiService

@Component({
  selector: 'app-list-people',
  standalone: true,
  imports: [CommonModule, FormsModule, Table, ConfirmationModal, Header],
  templateUrl: './list-people.html',
})
export class ListPeople implements OnInit {
  showModal = false;
  peopleForDeletId: number | null = null;
  peopleForDeletName: string = '';
  peopleList: Person[] = [];

  constructor(private router: Router, private toastr: ToastrService, private api: ApiService) {}

  // Call data
  ngOnInit() {
    this.fetchPeople();
  }

  // Get API data
  fetchPeople() {
    this.api.getPeople().subscribe({
      next: (data) => {
        this.peopleList = data;
        // loading = false
      },
      error: () => {
        this.toastr.error('Erro ao carregar a lista de pessoas.', 'Erro na API');
        // loading = false
      },
    });
  }

  handleEditDelete(event: { action: string; id: number }) {
    const { action, id } = event;
    if (action === 'editar') {
      this.editPerson(id);
    } else if (action === 'deletar') {
      this.deletePerson(id);
    }
  }

  deletePerson(id: number) {
    const pessoa = this.peopleList.find((p) => p.id === id);
    if (pessoa) {
      this.peopleForDeletId = id;
      this.peopleForDeletName = pessoa.nomeCompleto;
      this.showModal = true;
    }
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

  confirmDeletion() {
    if (this.peopleForDeletId !== null) {
      this.peopleList = this.peopleList.filter((p) => p.id !== this.peopleForDeletId);
      this.toastr.success('Pessoa removida com sucesso!', 'Sucesso');

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
}
