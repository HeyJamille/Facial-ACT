// Bibliotecas
import { Routes } from '@angular/router';

// Routes
import { Signin } from './public/signin/signin';

// Pages
import { RegisterPeople } from './public/register-people/register-people';
import { ListPeople } from './private/list-people/list-people';
import { DocumentsValidation } from './private/documents-validation/documents-validation';
import { VerifyCPF } from './public/verify-cpf/verify-cpf';
import { AccessDenied } from './public/access-denied/access-denied';

// Routes protected
import { AuthGuard } from './guards/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'verify-cpf', pathMatch: 'full' },
  { path: 'verify-cpf', component: VerifyCPF },
  { path: 'Auth/token', component: Signin },

  { path: 'Auth/login', component: Signin, canActivate: [AuthGuard] },

  {
    path: 'registerPeople',
    component: RegisterPeople,
    canActivate: [AuthGuard],
  },
  {
    path: 'listPeople',
    component: ListPeople,
    canActivate: [AuthGuard],
  },
  {
    path: 'documentsValidation',
    component: DocumentsValidation,
    canActivate: [AuthGuard],
  },
  { path: 'access-denied', component: AccessDenied },
];
