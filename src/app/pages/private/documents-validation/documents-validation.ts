// Bibliotecas
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
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
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-documents-validation',
  standalone: true,
  imports: [CommonModule, Header, Filter, Loading, Table],
  templateUrl: './documents-validation.html',
})
export class DocumentsValidation implements OnInit {
  showModal = false;
  personID: string | null = null;
  personName = '';

  // Dados
  allPeople: Person[] = [];
  filteredPeople: Person[] = [];

  // Paginação
  pageSize = 100;
  paginaUI = 1;
  paginaApi = 1;
  hasMoreApiData = true;

  // Estados
  isLoading = true;
  isBuscaGlobal = false;

  currentFilter: {
    term: string;
    filterBy: string;
  } | null = null;

  constructor(
    private toastr: ToastrService,
    private api: ApiService,
    private cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit() {
    await this.loadMoreFromApi();
    this.updateUIPagination();
  }

  // API
  private async loadMoreFromApi() {
    if (!this.hasMoreApiData) return;

    try {
      const data = await firstValueFrom(this.api.getPeoplePagination(this.paginaApi));

      if (!data || data.length === 0) {
        this.hasMoreApiData = false;
        return;
      }

      const mapped = data.map((person: any) => ({
        ...person,
        dataEnvioFacial: person.dataEnvioFacial ? new Date(person.dataEnvioFacial) : null,
      }));

      this.allPeople.push(...mapped);
      this.paginaApi++;
    } catch (err: any) {
      if (err.status === 401) {
        this.toastr.warning(
          'Sua sessão expirou. Por favor, faça login novamente.',
          'Sessão Expirada',
        );
        // O Interceptor que criamos cuidará do redirecionamento
      } else {
        this.toastr.error('Erro ao carregar dados da API');
      }

      this.hasMoreApiData = false;
    }
  }

  // PAGINAÇÃO UI
  private updateUIPagination() {
    const baseList = this.currentFilter ? this.applyStatusFilter(this.allPeople) : this.allPeople;

    const start = (this.paginaUI - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.filteredPeople = baseList.slice(start, end);

    this.isLoading = false;
    this.cdr.detectChanges();
  }

  async nextPage() {
    //this.isLoading = true;
    this.paginaUI++;

    while (this.allPeople.length < this.paginaUI * this.pageSize && this.hasMoreApiData) {
      await this.loadMoreFromApi();
    }

    this.updateUIPagination();
  }

  prevPage() {
    if (this.paginaUI > 1) {
      this.paginaUI--;
      this.updateUIPagination();
    }
  }

  // FILTRO
  async onFilter(event: { term: string; filterBy: string }) {
    this.currentFilter = event;
    this.paginaUI = 1;
    this.isLoading = true;

    const term = event.term?.trim().toLowerCase() || '';
    const filterBy = event.filterBy;

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

    const textFilters = ['email', 'documento'];

    // FILTRO DE STATUS
    if (statusFilters.includes(filterBy)) {
      this.isBuscaGlobal = false;

      while (this.hasMoreApiData) {
        await this.loadMoreFromApi();
      }

      this.updateUIPagination();
      return;
    }

    // BUSCA GLOBAL (EMAIL / DOCUMENTO)
    if (textFilters.includes(filterBy) && term) {
      this.isBuscaGlobal = true;

      // garante todos os dados
      while (this.hasMoreApiData) {
        await this.loadMoreFromApi();
      }

      this.filteredPeople = this.allPeople.filter((person: any) => {
        const value = person[filterBy as keyof Person];
        return value ? String(value).toLowerCase().includes(term) : false;
      });

      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    // LIMPAR FILTRO
    if (!term) {
      this.isBuscaGlobal = false;
      this.currentFilter = null;
      this.updateUIPagination();
    }
  }

  // FILTRO DE STATUS (GLOBAL)
  private applyStatusFilter(list: Person[]): Person[] {
    const filterBy = this.currentFilter?.filterBy;

    return list.filter((person) => {
      if (filterBy === 'documentosValidados') {
        return person.statusDocumento?.trim() === 'Documento Aprovado';
      }
      if (filterBy === 'documentosNaoEnviados') {
        return person.statusDocumento?.includes('Documento Não enviado');
      }
      if (filterBy === 'documentosPendentes') {
        return person.statusDocumento?.trim() === 'Documento Pendente Aprovação';
      }

      if (filterBy === 'carteirinhasValidadas') {
        return person.statusCarteirinha?.trim() === 'Carteirinha Aprovada';
      }
      if (filterBy === 'carteirinhasNaoEnviadas') {
        return person.statusCarteirinha?.includes('Carteirinha Não enviado');
      }
      if (filterBy === 'carteirinhasPendentes') {
        return person.statusCarteirinha?.trim() === 'Carteirinha Pendente Aprovação';
      }

      if (filterBy === 'facialValidadas') {
        return person.statusFacial?.trim() === 'Facial Aprovada';
      }
      if (filterBy === 'facialNaoEnviadas') {
        return person.statusFacial?.includes('Facial Não enviada');
      }
      if (filterBy === 'facialPendentes') {
        return person.statusFacial?.trim() === 'Facial Pendente Aprovação';
      }

      return true;
    });
  }

  get canGoNext(): boolean {
    const baseList = this.currentFilter ? this.applyStatusFilter(this.allPeople) : this.allPeople;

    const totalPages = Math.ceil(baseList.length / this.pageSize);

    // pode avançar se:
    // - ainda existe página no front
    // - ou ainda existe dado para vir da API
    return this.paginaUI < totalPages || this.hasMoreApiData;
  }
}
