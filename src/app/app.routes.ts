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
import { FacialViewer } from './components/facial-viewer/facial-viewer';
import { NotFound } from './pages/public/not-found/not-found';
import { FaceCapture } from './components/face-capture/face-capture';

export const routes: Routes = [
  { path: '', redirectTo: 'VerificarFacial', pathMatch: 'full' },
  { path: 'VerificarFacial', component: VerifyCPF },
  { path: 'Auth/token', component: Signin },

  { path: 'Auth/login', component: Signin }, //

  {
    path: 'RegistrarPessoa',
    component: RegisterPeople,
    canActivate: [AuthGuard],
  },
  {
    path: 'EditarPessoa',
    component: RegisterPeople,
    canActivate: [AuthGuard],
  },
  {
    path: 'VisualizarPessoa',
    component: RegisterPeople,
    canActivate: [AuthGuard],
  },
  {
    path: 'ListarPessoa',
    component: ListPeople,
    canActivate: [AuthGuard],
  },
  {
    path: 'ValidacaoDocumentos',
    component: DocumentsValidation,
    canActivate: [AuthGuard],
  },
  {
    path: 'VisualizarFacial',
    component: FacialViewer,
    canActivate: [AuthGuard],
  },
  { path: 'AcessoBloqueado', component: AccessDenied },
  { path: '**', component: NotFound },
];
