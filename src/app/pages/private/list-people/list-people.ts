// BIbliotecas
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Component, OnInit } from '@angular/core';

// Components
import { Table } from '../../../components/table/table';
import { ConfirmationModal } from '../../../components/confirmation-modal/confirmation-modal';
import { Header } from '../../../components/header/header';
import { Filter } from '../../../components/ui/filter/filter';

// Models
import { Person } from '../../../models/person.model';

// Services
import { ApiService } from '../../../services/api-service/api-service';

@Component({
  selector: 'app-list-people',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmationModal, Header, Filter, Table],
  templateUrl: './list-people.html',
})
export class ListPeople implements OnInit {
  showModal = false;
  peopleForDeletId: string = '';
  peopleForDeletName: string = '';
  peopleList: Person[] = [];
  filteredPeople: Person[] = [];
  hasSearched: boolean = false;

  loading: boolean = false;

  constructor(
    private router: Router,
    private toastr: ToastrService,
    private api: ApiService,
  ) {}

  // Call data
  ngOnInit() {
    this.fetchPeople();
  }

  // Get API data
  fetchPeople() {
    this.api.getPeople().subscribe({
      next: (data: any[]) => {
        // Map each people
        this.peopleList = data.map((person) => ({
          ...person,
          dataNascimento: person.dataNascimento ? new Date(person.dataNascimento) : null,
        }));

        // Clona para filtro
        this.filteredPeople = [];
      },
      error: (err) => {
        if (err.status === 401) {
          this.toastr.warning(
            'Sua sessão expirou. Por favor, faça login novamente.',
            'Sessão Expirada',
          );
        } else {
          this.toastr.error('Erro ao carregar a lista de pessoas.', 'Erro na API');
        }
      },
    });
  }

  // Receives event from Filter
  onFilter(event: { term: string; filterBy: string }) {
    const termLower = event.term.toLowerCase();
    this.hasSearched = !!termLower; // control visibilly

    // If there is no term, show all
    if (!event.term || event.term.trim() === '') {
      this.filteredPeople = [...this.peopleList];
      return;
    }

    this.filteredPeople = this.peopleList.filter((person) => {
      const value = person[event.filterBy as keyof Person];
      if (!value) return false;

      // Converts any value to string and compares
      return String(value).toLowerCase().includes(termLower);
    });
  }

  handleEditDelete(event: { action: string; id: string }) {
    const { action, id } = event;
    if (action === 'editar') {
      this.editPerson(id);
    } else if (action === 'deletar') {
      this.deletePerson(id);
    }
  }

  deletePerson(id: string) {
    const pessoa = this.peopleList.find((p) => p.id === id);
    if (pessoa) {
      this.peopleForDeletId = id;
      this.peopleForDeletName = pessoa.nomeCompleto;
      this.showModal = true;
    }
  }

  editPerson(personId: string) {
    const person = this.peopleList.find((p) => p.id === personId);
    if (!person) {
      this.toastr.error('Uusário não encontrado', 'Erro');
      return;
    }

    // simple deep copy
    const copy = JSON.parse(JSON.stringify(person));

    // remove sensitive fields if they exist
    delete copy.senha;

    this.toastr.success('Redirecionando para visualização...', 'Sucesso');
    setTimeout(() => {
      this.router.navigate(['/VisualizarDados'], { state: { person: copy, personId } });
    }, 500);
  }

  confirmDeletion() {
    this.loading = true;
    if (!this.peopleForDeletId) return;

    this.api.deletePerson(this.peopleForDeletId).subscribe({
      next: () => {
        this.toastr.success('Pessoa deletada com sucesso!', 'Sucesso');
        this.loading = false;
        this.peopleList = this.peopleList.filter((p) => p.id !== this.peopleForDeletId);

        this.peopleForDeletId = '';
        this.peopleForDeletName = '';
        this.showModal = false;
        this.fetchPeople();
      },
      error: () => {
        this.toastr.error('Erro ao deletar pessoa', 'Erro');
        this.loading = false;
      },
    });
  }

  closeModal() {
    this.peopleForDeletId = '';
    this.peopleForDeletName = '';
    this.showModal = false;
  }

  // Called when the user confirms in the modal
  deletePersonConfirmed(id: string) {
    const pessoa = this.peopleList.find((p) => p.id === id);
    if (!pessoa) {
      this.toastr.error('Pessoa não encontrada!', 'Erro');
      return;
    }

    // Open Confirmation Modal
    this.peopleForDeletId = id;
    this.peopleForDeletName = pessoa.nomeCompleto;
    this.showModal = true;
  }
}
