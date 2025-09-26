import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api-service/api-service';
import { Person } from '../../models/person.model';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './table.html',
})
export class Table implements OnInit {
  peopleList = signal<Person[]>([]);
  loading = signal(false);
  error = signal('');

  @Output() editPerson = new EventEmitter<number>();
  @Output() deletePerson = new EventEmitter<number>();

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.fetchPeople();
  }

  fetchPeople() {
    this.loading.set(true);
    this.api.getPeople().subscribe({
      next: (data) => {
        this.peopleList.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Erro ao carregar usuários');
        this.loading.set(false);
      },
    });
  }

  onEdit(id: number) {
    this.editPerson.emit(id);
  }

  onDelete(id: number) {
    this.deletePerson.emit(id);
  }
}
