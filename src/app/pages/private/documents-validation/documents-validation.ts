// BIbliotecas
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

// Componentes
import { Header } from '../../../components/header/header';
import { Table } from '../../../components/table/table';
import { Filter } from '../../../components/ui/filter/filter';

// Models
import { Person } from '../../../models/person.model';

// Services
import { ApiService } from '../../../services/api-service/api-service';

@Component({
  selector: 'app-documents-validation',
  standalone: true,
  imports: [Header, Table, Filter],
  templateUrl: './documents-validation.html',
})
export class DocumentsValidation implements OnInit {
  showModal = false;
  //showModal = false;
  personID: string | null = null;
  personName: string = '';
  peopleList: Person[] = [];
  filteredPeople: Person[] = [];

  constructor(private router: Router, private toastr: ToastrService, private api: ApiService) {}

  ngOnInit() {
    this.fetchPeople();
  }

  fetchPeople() {
    this.api.getPeople().subscribe({
      next: (data: any[]) => {
        // Map each people
        this.peopleList = data.map((person) => ({
          ...person,
          celular: this.formatPhone(person.celular),
          dataEnvioFacial: person.dataEnvioFacial ? new Date(person.dataEnvioFacial) : null,
        }));

        // Clona para filtro
        this.filteredPeople = [...this.peopleList];
      },
      error: () => {
        this.toastr.error('Erro ao carregar a lista de pessoas.', 'Erro na API');
      },
    });
  }

  formatPhone(value: string | number): string {
    if (!value) return '';
    const v = value.toString().replace(/\D/g, '');
    if (v.length === 11) return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7, 11)}`;
    if (v.length === 10) return `(${v.slice(0, 2)}) ${v.slice(2, 6)}-${v.slice(6, 10)}`;
    return value.toString();
  }

  onFilter(event: { term: string; filterBy: string }) {
    if (!event.term || event.term.trim() === '') {
      this.filteredPeople = [...this.peopleList];
      return;
    }

    const termLower = event.term.toLowerCase();
    this.filteredPeople = this.peopleList.filter((person) => {
      const value = person[event.filterBy as keyof Person];
      if (!value) return false;
      return String(value).toLowerCase().includes(termLower);
    });
  }

  handleDocumentAction(event: { action: string; id: string }) {
    const pessoa = this.peopleList.find((p) => p.id === event.id);
    if (!pessoa) return;

    this.personID = event.id;
    this.personName = pessoa.nomeCompleto;

    if (event.action === 'aprovar') {
      this.showModal = true;
    } else if (event.action === 'reprovar') {
      this.showModal = true;
    }
  }

  confirmApprove() {
    if (!this.personID) return;

    const pessoa = this.peopleList.find((p) => p.id === this.personID);
    if (!pessoa) return;

    const updatedPerson: Person = {
      ...pessoa,
      statusValidacao: 'Aprovado',
    };

    this.api.updatePerson(updatedPerson).subscribe({
      next: () => this.toastr.success('Usuário aprovado!', 'Sucesso'),
      error: () => this.toastr.error('Erro ao aprovar usuário.', 'Erro'),
    });

    this.closeApproveModal();
  }

  confirmDisapprove() {
    if (!this.personID) return;

    const pessoa = this.peopleList.find((p) => p.id === this.personID);
    if (!pessoa) return;

    const updatedPerson: Person = {
      ...pessoa,
      statusValidacao: 'Reprovado',
    };

    this.api.updatePerson(updatedPerson).subscribe({
      next: () => this.toastr.success('Usuário reprovado!', 'Sucesso'),
      error: () => this.toastr.error('Erro ao reprovar usuário.', 'Erro'),
    });

    this.closeDisapproveModal();
  }

  closeApproveModal() {
    this.showModal = false;
    this.personID = null;
    this.personName = '';
  }

  closeDisapproveModal() {
    this.showModal = false;
    this.personID = null;
    this.personName = '';
  }
}
