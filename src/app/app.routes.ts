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
import { FacialViewer } from './components/facial-viewer/facial-viewer';
import { NotFound } from './public/not-found/not-found';
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
