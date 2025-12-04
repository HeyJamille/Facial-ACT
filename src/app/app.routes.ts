// Bibliotecas
import { Routes } from '@angular/router';

// Routes
import { Signin } from './pages/public/signin/signin';

// Pages
import { RegisterPeople } from './pages/public/register-people/register-people';
import { ListPeople } from './pages/private/list-people/list-people';
import { DocumentsValidation } from './pages/private/documents-validation/documents-validation';
import { VerifyCPF } from './pages/public/verify-cpf/verify-cpf';
import { AccessDenied } from './pages/public/access-denied/access-denied';

// Routes protected
import { AuthGuard } from './guards/auth-guard';
import { NotFound } from './pages/public/not-found/not-found';
import { Dashboard } from './pages/private/dashboard/dashboard';
import { FaceCapturePage } from './pages/public/face-capture-page/face-capture-page';
import { Documents } from './pages/public/documents/documents';
import { ReviewPeople } from './pages/public/review-people/review-people';

export const routes: Routes = [
  { path: '', redirectTo: 'VerificarFacial', pathMatch: 'full' },
  { path: 'VerificarFacial', component: VerifyCPF },
  { path: 'Auth/token', component: Signin },
  { path: 'Auth/login', component: Signin },

  /* PUBLIC */
  {
    path: 'RegistrarPessoa',
    component: RegisterPeople,
    canActivate: [AuthGuard],
  },
  {
    path: 'Documentos',
    component: Documents,
    canActivate: [AuthGuard],
  },
  {
    path: 'CapturaFacial',
    component: FaceCapturePage,
    canActivate: [AuthGuard],
  },
  {
    path: 'RevisaoFinal',
    component: ReviewPeople,
    canActivate: [AuthGuard],
  },
  {
    path: 'EditarDados',
    component: ReviewPeople,
    canActivate: [AuthGuard],
  },

  /* PRIVATE */
  {
    path: 'VisualizarDados',
    component: ReviewPeople,
    canActivate: [AuthGuard],
  },
  {
    path: 'Pesquisa',
    component: ListPeople,
    canActivate: [AuthGuard],
  },
  {
    path: 'ValidacaoDocumentos',
    component: DocumentsValidation,
    canActivate: [AuthGuard],
  },
  {
    path: 'Inicio',
    component: Dashboard,
    canActivate: [AuthGuard],
  },

  { path: 'AcessoBloqueado', component: AccessDenied },
  { path: '**', component: NotFound },
];
