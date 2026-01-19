// BIbliotecas
import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';

// Componentes
import { Header } from '../../../components/header/header';
import { Table } from '../../../components/table/table';
import { Filter } from '../../../components/ui/filter/filter';
import { Loading } from '../../../components/ui/loading/loading';

// Models
import { Person } from '../../../models/person.model';

// Services
import { ApiService } from '../../../services/api-service/api-service';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-documents-validation',
  standalone: true,
  imports: [CommonModule, Header, Filter, Loading, Table],
  templateUrl: './documents-validation.html',
})
export class DocumentsValidation implements OnInit {
  showModal = false;
  personID: string | null = null;
  personName: string = '';
  peopleList: Person[] = [];
  filteredPeople: Person[] = [];
  isLoading: boolean = true;

  constructor(
    private toastr: ToastrService,
    private api: ApiService,
  ) {}

  ngOnInit() {
    this.fetchPeople();
  }

  fetchPeople() {
    this.isLoading = true;
    this.api.getPeople().subscribe({
      next: (data: any[]) => {
        // Map each people
        this.peopleList = data.map((person) => ({
          ...person,
          dataEnvioFacial: person.dataEnvioFacial ? new Date(person.dataEnvioFacial) : null,
        }));

        // Filters only people with completed documents, ID cards or facial recognition
        this.filteredPeople = this.peopleList.filter(
          (person) => person.arquivoDocumento !== null && person.aprovadorDocumentoId === null,
        );
        console.log('this.filteredPeople ', this.filteredPeople.length);
        this.isLoading = false;
      },
      error: () => {
        this.toastr.error('Erro ao carregar a lista de pessoas.', 'Erro na API');
        this.isLoading = false;
      },
    });
  }

  onFilter(event: { term: string; filterBy: string }) {
    // 1. Caso de "Mostrar Tudo": Termo vazio e filtro não é de status especial
    const statusFilters = [
      'documentosPendentes',
      'documentosNaoEnviados',
      'documentosValidados',

      'carteirinhasPendentes',
      'carteirinhasNaoEnviadas',
      'carteirinhasValidadas',

      'facialPendentes',
      'facialNaoEnviadas',
      'facialValidadas',
    ];

    if (!event.term?.trim() && !statusFilters.includes(event.filterBy)) {
      this.filteredPeople = [...this.peopleList];
      console.log('this.filteredPeople ', this.filteredPeople.length);
      return;
    }

    const termLower = event.term?.toLowerCase();

    this.filteredPeople = this.peopleList.filter((person) => {
      // 1. Lógica para Documentos Validados - Documento ok
      if (event.filterBy === 'documentosValidados') {
        return person.statusDocumento === 'Documento Aprovado';
      }

      // 2. Lógica para Documentos Não Enviados - Faltando o envio
      if (event.filterBy === 'documentosNaoEnviados') {
        return person.statusDocumento === 'Documento Não enviado';
      }

      // 3. Lógica para Documentos Pendentes - Aguardando validação
      if (event.filterBy === 'documentosPendentes') {
        return person.statusDocumento === 'Documento Pendente';
      }

      // 1. Lógica para Carteirinhas Validados - Documento ok
      if (event.filterBy === 'carteirinhasValidadas') {
        return person.statusCarteirinha === 'Carteirinha Aprovada';
      }

      // 2. Lógica para Carteirinhas Não Enviados - Faltando o envio
      if (event.filterBy === 'carteirinhasNaoEnviadas') {
        return person.statusCarteirinha === 'Carteirinha Não enviada';
      }

      // 3. Lógica para Carteirinhas Pendentes - Aguardando validação
      if (event.filterBy === 'carteirinhasPendentes') {
        return person.statusCarteirinha === 'Carteirinha Pendente';
      }

      // 1. Lógica para Facial Validados - Documento ok
      if (event.filterBy === 'facialValidadas') {
        return person.statusFacial === 'Facial Aprovada';
      }

      // 2. Lógica para Facial Não Enviados - Faltando o envio
      if (event.filterBy === 'facialNaoEnviadas') {
        return person.statusFacial === 'Facial Não enviada';
      }

      // 3. Lógica para Facial Pendentes - Aguardando validação
      if (event.filterBy === 'facialPendentes') {
        return person.statusFacial === 'Facial Pendente';
      }

      console.log('this.filteredPeople ', this.filteredPeople.length);

      // 5. Filtro padrão (Busca por texto em Nome, Email, Documento, etc)
      const value = person[event.filterBy as keyof Person];
      if (!value) return false;
      return String(value).toLowerCase().includes(termLower);
    });
  }
}
