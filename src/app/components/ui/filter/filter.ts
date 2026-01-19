// Bibliotecas
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule, NgModel } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

// Components
import { Button } from '../button/button';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-filter',
  imports: [FormsModule, Button, CommonModule],
  templateUrl: './filter.html',
  standalone: true,
})
export class Filter {
  loading = false;
  buttonTitle = '';
  term: string = '';
  //filterBy: string = 'documentosPendentes';
  filterBy: string = '';

  isValidacaoPage: boolean = true;

  constructor(
    private toastr: ToastrService,
    private router: Router,
  ) {}

  @Output() search = new EventEmitter<{ term: string; filterBy: string }>();

  ngOnInit() {
    // Verifica se a URL atual contém 'validacao-documentos' (ou o nome da sua rota)
    this.isValidacaoPage = this.router.url.includes('ValidacaoDocumentos');

    this.filterBy = this.isValidacaoPage ? 'documentosPendentes' : 'documento';

    // Opcional: Log para você conferir no console
    console.log('Página de validação?', this.isValidacaoPage);
  }

  onSearch() {
    const term = this.term.trim();
    const filter = this.filterBy;

    if (filter === 'mostrarTodos') {
      this.search.emit({ term: '', filterBy: filter });
      return;
    }

    // Validação para campos que EXIGEM texto (documento/email)
    if (term === '' && (filter === 'documento' || filter === 'email')) {
      this.toastr.warning('Digite algo a ser pesquisado.');
      return;
    }

    if (term.length < 11 && (filter === 'documento' || filter === 'email')) {
      this.toastr.warning('Digite pelo menos 11 caracteres para realizar a pesquisa.');
      return;
    }

    this.search.emit({ term: term, filterBy: filter });
  }

  get isTextInputDisabled(): boolean {
    const statusFilters = [
      'mostrarTodos', // Adicionado aqui
      'documentosPendentes',
      'documentosNaoEnviados',
      'documentosValidados',
      'carteirinhasPendentes',
      'carteirinhasNaoEnviados',
      'carteirinhasValidadas',
      'facialPendentes',
      'facialNaoEnviados',
      'facialValidadas',
    ];

    return statusFilters.includes(this.filterBy);
  }

  // No filter.ts
  onFilterChange() {
    if (this.isTextInputDisabled) {
      this.term = ''; // Limpa o campo se ele for desabilitado
    }
  }
}
