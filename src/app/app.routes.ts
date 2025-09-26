import { Routes } from '@angular/router';

// Pages
import { Signin } from './public/signin/signin';
import { Signup } from './private/signup/signup';
import { RegisterPeople } from './public/register-people/register-people';
import { ListPeople } from './private/list-people/list-people';
import { VerifyCPF } from './public/verify-cpf/verify-cpf';

export const routes: Routes = [
  { path: '', component: VerifyCPF },
  {
    path: 'Auth/token',
    component: Signin,
  },
  {
    path: 'Auth/login',
    component: Signin,
  },
  {
    path: 'signup',
    component: Signup,
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
