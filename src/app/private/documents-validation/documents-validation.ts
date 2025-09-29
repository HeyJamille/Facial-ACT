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
  // <-- 3. Implementar OnInit
  showModal = false;
  peopleForDeletId: number | null = null;
  peopleForDeletName: string = '';
  peopleList: Person[] = []; // Onde os dados da API serão armazenados

  // 4. Injetar ApiService
  constructor(
    private router: Router,
    private toastr: ToastrService,
    private api: ApiService // <-- Injeção
  ) {}

  // 5. Chamada de dados no ciclo de vida
  ngOnInit() {
    this.fetchPeople();
  }

  // 6. Método para puxar os dados da API
  fetchPeople() {
    // Você pode adicionar uma variável 'loading = true' aqui, se desejar.
    this.api.getPeople().subscribe({
      next: (data) => {
        this.peopleList = data; // <--- Armazena os dados aqui
        // loading = false
      },
      error: () => {
        this.toastr.error('Erro ao carregar a lista de pessoas.', 'Erro na API');
        // loading = false
      },
    });
  }

  // O método handleEditDelete que faltava e corrige os ícones
  handleDocumentAction(event: { action: string; id: number }) {
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
      // 7. A exclusão também é feita aqui, atualizando a lista
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
