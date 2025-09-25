import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { AuthForm } from '../../components/auth-form/auth-form';
import { RecoverPwd } from '../../components/recover-pwd/recover-pwd';
import people from '../../data/people.json';

@Component({
  selector: 'app-signin',
  imports: [CommonModule, FormsModule, AuthForm, RecoverPwd],
  templateUrl: './signin.html',
})
export class Signin {
  onSignin(data: any) {}

  peopleList = people;

  @Output() linkClick = new EventEmitter<void>();

  showModal = false;

  openRecoverModal() {
    this.showModal = true;
  }

  closeRecoverModal() {
    this.showModal = false;
  }

  peopleForDeletId: number | null = null;
  peopleForDeletName: string = '';

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
}
