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
import { SeoRota } from './services/seo';
import { environment } from '../environments/environment';

const DESCRICAO_SITE =
  'Checklist de conformidade com a LGPD para desenvolvedores, baseado em checklists validados ' +
  'academicamente, com relatório e recomendações técnicas geradas por IA.';

// Paginas publicas: pre-renderizadas no build (app.routes.server.ts) e indexadas.
const SEO_LANDING: SeoRota = {
  titulo: 'DevComply: conformidade com a LGPD no desenvolvimento de software',
  descricao: DESCRICAO_SITE,
  indexar: true,
  // Dados estruturados: so o que a pagina mostra (sem preco: a landing nao fala nisso).
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'DevComply',
    url: environment.siteUrl + '/',
    description: DESCRICAO_SITE,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
    inLanguage: 'pt-BR',
    citation: [
      'https://sol.sbc.org.br/index.php/sbes/article/view/18822',
      'https://sol.sbc.org.br/index.php/sbqs/article/view/27108',
    ],
  },
};
const SEO_POLITICA: SeoRota = {
  titulo: 'Política de Privacidade | DevComply',
  descricao:
    'Como o DevComply trata os dados de quem usa a ferramenta: o que coleta, para quê, o envio ao ' +
    'Google Gemini, por quanto tempo guarda e como exercer seus direitos pela LGPD.',
  indexar: true,
};
const SEO_TERMOS: SeoRota = {
  titulo: 'Termos de Uso | DevComply',
  descricao:
    'Condições de uso do DevComply, a ferramenta de apoio à conformidade com a LGPD para ' +
    'desenvolvedores de software.',
  indexar: true,
};
// Login, cadastro e area logada: nada para indexar (noindex).
const seoPrivado = (titulo: string): { seo: SeoRota } => ({ seo: { titulo: `${titulo} | DevComply` } });

export const routes: Routes = [
  // === LANDING PAGE (pública) ===
  { path: '', component: LandingComponent, data: { seo: SEO_LANDING } },
  
  // === PÁGINAS PÚBLICAS (acesso sem login) ===
  { path: 'login', component: LoginComponent, data: seoPrivado('Entrar') },
  { 
    path: 'register', 
    loadComponent: () => import('./pages/login/register/register').then(m => m.Register),
    data: seoPrivado('Criar conta'),
  },
  // Termos e Política devem ser PÚBLICOS
  { path: 'termos-uso', component: TermosUso, data: { seo: SEO_TERMOS } },
  { path: 'politica-privacidade', component: PoliticaPrivacidade, data: { seo: SEO_POLITICA } },

  // === ÁREA PROTEGIDA (requer login) - SEM prefixo /app ===
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: Dashboard, data: seoPrivado('Dashboard') },
      { path: 'projects', component: Projects, data: seoPrivado('Projetos') },
      {
        path: 'projects/:id/relatorios',
        loadComponent: () => import('./pages/project-reports/project-reports').then(m => m.ProjectReports),
        data: seoPrivado('Relatórios do projeto'),
      },
      { path: 'checklist/:id', component: Checklist, data: seoPrivado('Checklist LGPD') },
      { path: 'checklist', redirectTo: 'projects', pathMatch: 'full' },
      { path: 'settings', component: Settings, data: seoPrivado('Configurações') },
      { path: 'profile', component: ProfileComponent, data: seoPrivado('Perfil') },
    ]
  },

  // Redirecionamento padrão para dashboard após login
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  { path: '**', redirectTo: 'dashboard' }
];