import { Component } from '@angular/core';
import { Header } from '../../components/header/header';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-list-people',
  imports: [CommonModule, FormsModule, Header],
  templateUrl: './list-people.html',
})
export class ListPeople {}
