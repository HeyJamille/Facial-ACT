import { Component } from '@angular/core';
import { Header } from '../../components/header/header';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import people from '../../data/people.json';
import { ConfirmationModal } from '../../components/confirmation-modal/confirmation-modal';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-list-people',
  imports: [CommonModule, FormsModule, Header, ConfirmationModal],
  templateUrl: './list-people.html',
})
export class ListPeople {
  peopleList = people;
  showModal = false;
  peopleForDeletId: number | null = null;
  peopleForDeletName: string = '';

  constructor(private router: Router, private toastr: ToastrService) {}

  deletPerson(id: number) {
    const pessoa = this.peopleList.find((p) => p.id === id);
    if (pessoa) {
      this.peopleForDeletId = id;
      this.peopleForDeletName = pessoa.name;
      this.showModal = true;
    }
  }

  confirmDeletion() {
    if (this.peopleForDeletId !== null) {
      this.peopleList = this.peopleList.filter((p) => p.id !== this.peopleForDeletId);
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

  editPerson(id: number) {
    const person = this.peopleList.find((p) => p.id === id);
    if (person) {
      this.toastr.success('Redirecionando para a página de edição', 'Sucesso');
      setTimeout(() => {
        this.router.navigate(['/registerPeople'], { state: { person } });
      }, 500);
    }
  }
}
