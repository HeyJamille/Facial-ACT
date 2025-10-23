// Bibliotecas
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

// Components
import { Button } from '../button/button';

@Component({
  selector: 'app-filter',
  imports: [FormsModule, Button],
  templateUrl: './filter.html',
  standalone: true,
})
export class Filter {
  loading = false;
  buttonTitle = '';
  term: string = '';
  filterBy: string = '';

  constructor(private toastr: ToastrService) {}

  @Output() search = new EventEmitter<{ term: string; filterBy: string }>();

  onSearch() {
    if (this.term.trim() === '') {
      this.toastr.warning('Digite algo a ser pesquisado.');
      return;
    }

    if (this.term.length < 11) {
      this.toastr.warning('Digite pelo menos 11 caracteres para realizar a pesquisa.');
      return;
    }
    this.search.emit({ term: this.term, filterBy: this.filterBy });
  }
}
