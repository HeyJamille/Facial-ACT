import { Component } from '@angular/core';
import { Header } from '../../components/header/header';
import people from '../../data/people.json';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-register-courtesy',
  imports: [CommonModule, FormsModule, Header],
  templateUrl: './register-courtesy.html',
})
export class RegisterCourtesy {
  peopleList = people;
}
