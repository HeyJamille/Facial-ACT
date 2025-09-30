import { Component } from '@angular/core';
import { Header } from '../../components/header/header';
import { Table } from '../../components/table/table';
import { ConfirmationModal } from '../../components/confirmation-modal/confirmation-modal';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Person } from '../../models/person.model';
import { ApiService } from '../../services/api-service/api-service';

@Component({
  selector: 'app-documents-validation',
  imports: [Header, Table, ConfirmationModal],
  templateUrl: './documents-validation.html',
})
export class DocumentsValidation {
  showModal = false;
  peopleForDeletId: string | null = null;
  peopleForDeletName: string = '';
  peopleList: Person[] = [];

  constructor(private router: Router, private toastr: ToastrService, private api: ApiService) {}

  // Call data
  ngOnInit() {
    this.fetchPeople();
  }

  // Get data API
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

  handleDocumentAction(event: { action: string; id: string }) {
    const { action, id } = event;
    if (action === 'aprovar') {
      this.approveDocs(id);
    } else if (action === 'reprovar') {
      this.disapproveDocs(id);
    }
  }

  disapproveDocs(id: string) {
    const pessoa = this.peopleList.find((p) => p.id === id);
    if (pessoa) {
      this.peopleForDeletId = id;
      this.peopleForDeletName = pessoa.nomeCompleto;
      this.showModal = true;
    }

    this.toastr.success('Em desenvolvimento.', 'Sucesso');
  }

  approveDocs(id: string) {
    const pessoa = this.peopleList.find((p) => p.id === id);
    if (pessoa) {
      this.peopleForDeletId = id;
      this.peopleForDeletName = pessoa.nomeCompleto;
      this.showModal = true;
    }

    this.toastr.success('Em desenvolvimento.', 'Sucesso');
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
