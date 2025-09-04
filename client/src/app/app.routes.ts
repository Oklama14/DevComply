import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { MainLayout } from './layouts/main-layout/main-layout';
import { Projects } from './pages/projects/projects';
import { Checklist } from './pages/checklist/checklist';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: MainLayout,
    // canActivate: [authGuard],
    children: [
      { path: 'projects', component: Projects },
      // A rota agora espera um ID de projeto
      { path: 'checklist/:projectId', component: Checklist },
      { path: '', redirectTo: 'projects', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
