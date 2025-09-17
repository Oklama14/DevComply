import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { MainLayout } from './layouts/main-layout/main-layout';
import { Dashboard } from './pages/dashboard/dashboard';
import { Projects } from './pages/projects/projects';
import { Checklist } from './pages/checklist/checklist';
import { authGuard } from './guards/auth-guard';
import { Settings } from './pages/settings/settings';

export const routes: Routes = [
  // === PÚBLICAS ===
  { path: 'login', component: LoginComponent },
  // Register como standalone lazy
  { path: 'register', loadComponent: () =>
      import('./pages/login/register/register').then(m => m.Register) },

  // === ÁREA PROTEGIDA (usa MainLayout) ===
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'projects', component: Projects },
      { path: 'checklist/:id', component: Checklist },
      { path: 'checklist', redirectTo: 'projects', pathMatch: 'full' },
      { path: 'settings', component: Settings },

      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ]
  },

  { path: '**', redirectTo: 'login' }
];
