import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { Header } from '../../components/header/header';
import { ToastrService } from 'ngx-toastr';
import { NgxMaskDirective } from 'ngx-mask';
@Component({
  selector: 'app-register-people',
  imports: [CommonModule, FormsModule, Header, NgxMaskDirective],
  templateUrl: './register-people.html',
})
export class RegisterPeople implements OnInit {
  constructor(private router: Router, private toastr: ToastrService) {}
  pageTitle: string = 'Cadastrar nova Pessoa';
  toastTitle: string = 'Cadastro';
  buttonTitle: string = 'Cadastrar';

  onSubmit(form: NgForm) {
    if (form.valid) {
      this.toastr.success(`${this.toastTitle} realizado(a) com sucesso!`, 'Sucesso');
    }
  }

  // CPF Validation
  isCPFValid(cpf: string): boolean {
    const cleaned = cpf.replace(/\D/g, '');
    return cleaned.length === 11;
  }

  person: any = {
    id: null,
    name: '',
    email: '',
    dateOfBirth: '',
    phone: '',
    cpf: '',
    road: '',
    number: null,
    district: '',
    cep: '',
    city: '',
    state: '',
    fatherName: '',
    motherName: '',
  };

  ngOnInit() {
    const state = history.state;

    if (state && state.person) {
      this.person = state.person;
      this.pageTitle = 'Editar Pessoa';
      this.toastTitle = 'Editação';
      this.buttonTitle = 'Editar';
    }
  }

  // Document Upload
  previewUrl: string | ArrayBuffer | null = null;
  isDragOver = false;

  onFileSelected(event: any) {
    const file = event.target.files[0];
    this.preview(file);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
    if (event.dataTransfer?.files.length) {
      const file = event.dataTransfer.files[0];
      this.preview(file);
    }
  }

  preview(file: File) {
    const reader = new FileReader();
    reader.onload = () => (this.previewUrl = reader.result);
    reader.readAsDataURL(file);
  }
}
