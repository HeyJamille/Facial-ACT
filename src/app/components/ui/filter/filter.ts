// Bibliotecas
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-filter',
  imports: [FormsModule],
  templateUrl: './filter.html',
  standalone: true,
})
export class Filter {
  term: string = '';
  filterBy: string = '';

  @Output() search = new EventEmitter<{ term: string; filterBy: string }>();

  onSearch() {
    this.search.emit({ term: this.term, filterBy: this.filterBy });
  }
}
