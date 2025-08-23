import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { MainLayout } from './layouts/main-layout/main-layout';
import { Projects } from './pages/projects/projects';
import { Checklist } from './pages/checklist/checklist'; // 1. Importe o Checklist
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },

  {
    path: '',
    component: MainLayout,
    //canActivate: [authGuard],
    children: [
      { path: 'projects', component: Projects },
      { path: 'checklist', component: Checklist }, // 2. Adicione a rota do checklist
      { path: '', redirectTo: 'projects', pathMatch: 'full' }
    ]
  },

  { path: '**', redirectTo: 'login' }
];
