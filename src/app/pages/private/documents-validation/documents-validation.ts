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

@Component({
  selector: 'app-documents-validation',
  standalone: true,
  imports: [CommonModule, Header, Table, Filter, Loading],
  templateUrl: './documents-validation.html',
})
export class DocumentsValidation implements OnInit {
  showModal = false;
  personID: string | null = null;
  personName: string = '';
  peopleList: Person[] = [];
  filteredPeople: Person[] = [];
  isLoading: boolean = true;

  constructor(private toastr: ToastrService, private api: ApiService) {}

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
          (person) => person.arquivoCarteirinha || person.arquivoDocumento || person.arquivoFacial
        );
        this.isLoading = false;
      },
      error: () => {
        this.toastr.error('Erro ao carregar a lista de pessoas.', 'Erro na API');
        this.isLoading = false;
      },
    });
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
}
