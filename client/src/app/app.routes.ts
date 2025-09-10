import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { MainLayout } from './layouts/main-layout/main-layout';
import { Dashboard } from './pages/dashboard/dashboard';
import { Projects } from './pages/projects/projects';
import { Checklist } from './pages/checklist/checklist';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  // Rota pública
  { path: 'login', component: LoginComponent },

  // Rotas protegidas que usam o MainLayout
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard], // O guarda protege este grupo de rotas
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'projects', component: Projects },
      { path: 'checklist/:projectId', component: Checklist },
      // Redireciona a raiz da área logada para o dashboard
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // Se nenhuma rota corresponder, redireciona para o login
  { path: '**', redirectTo: 'login' }
];
