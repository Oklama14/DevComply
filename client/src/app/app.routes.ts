import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { MainLayout } from './layouts/main-layout/main-layout';
import { Dashboard } from './pages/dashboard/dashboard';
import { Projects } from './pages/projects/projects';
import { Checklist } from './pages/checklist/checklist';
import { authGuard } from './guards/auth-guard';
import { Settings } from './pages/settings/settings';
import { PoliticaPrivacidade } from './pages/politica-privacidade/politica-privacidade';
import { TermosUso } from './pages/termos-uso/termos-uso';

export const routes: Routes = [
  // === PÁGINAS PÚBLICAS (acesso sem login) ===
  { path: 'login', component: LoginComponent },
  { 
    path: 'register', 
    loadComponent: () => import('./pages/login/register/register').then(m => m.Register) 
  },
  // Termos e Política devem ser PÚBLICOS
  { path: 'termos-uso', component: TermosUso },
  { path: 'politica-privacidade', component: PoliticaPrivacidade },

  // === ÁREA PROTEGIDA (requer login) ===
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