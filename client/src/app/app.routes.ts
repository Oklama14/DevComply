// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { LoginComponent } from './pages/login/login';
import { MainLayout } from './layouts/main-layout/main-layout';
import { Dashboard } from './pages/dashboard/dashboard';
import { Projects } from './pages/projects/projects';
import { Checklist } from './pages/checklist/checklist';
import { authGuard } from './guards/auth-guard';
import { Settings } from './pages/settings/settings';
import { PoliticaPrivacidade } from './pages/politica-privacidade/politica-privacidade';
import { TermosUso } from './pages/termos-uso/termos-uso';
import { ProfileComponent } from './pages/profile/profile';

export const routes: Routes = [
  // === LANDING PAGE (pública) ===
  { path: '', component: LandingComponent },
  
  // === PÁGINAS PÚBLICAS (acesso sem login) ===
  { path: 'login', component: LoginComponent },
  { 
    path: 'register', 
    loadComponent: () => import('./pages/login/register/register').then(m => m.Register) 
  },
  // Termos e Política devem ser PÚBLICOS
  { path: 'termos-uso', component: TermosUso },
  { path: 'politica-privacidade', component: PoliticaPrivacidade },

  // === ÁREA PROTEGIDA (requer login) - SEM prefixo /app ===
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
      { path: 'profile', component: ProfileComponent },
    ]
  },

  // Redirecionamento padrão para dashboard após login
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  { path: '**', redirectTo: 'dashboard' }
];