import { Routes } from '@angular/router';

// Pages
import { Signin } from './public/signin/signin';
import { RegisterPeople } from './private/register-people/register-people';
import { ListPeople } from './private/list-people/list-people';
import { VerifyCPF } from './public/verify-cpf/verify-cpf';

export const routes: Routes = [
  { path: '', component: VerifyCPF },
  {
    path: 'signin',
    component: Signin,
  },
  {
    path: 'registerPeople',
    component: RegisterPeople,
  },
  {
    path: 'listPeople',
    component: ListPeople,
  },
];
