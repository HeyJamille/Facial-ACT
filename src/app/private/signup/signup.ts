import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Signin } from '../signin/signin';

@Component({
  selector: 'app-signup',
  imports: [FormsModule, CommonModule],
  templateUrl: './signup.html',
})
export class Signup {}
