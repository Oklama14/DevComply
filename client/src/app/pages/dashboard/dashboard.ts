import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ProjectsService, Project } from '../../services/projects';
import { Router, RouterLink } from '@angular/router';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe'; // Importe o pipe

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, SafeHtmlPipe], // Adicione o pipe aqui
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class Dashboard implements OnInit {
  platformId = inject(PLATFORM_ID);

  // Propriedades declaradas para o template
  totalProjects: number = 0;
  completedProjects: number = 0;
  inProgressProjects: number = 0;
  pendingProjects: number = 0;

  features = [
    {
      name: 'Checklist Interativo',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`,
      description: 'Lista detalhada de requisitos LGPD específicos para desenvolvedores com orientações técnicas.'
    },
    {
      name: 'Análise de Conformidade',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
      description: 'Avaliação automatizada das suas implementações com recomendações técnicas específicas.'
    },
    {
      name: 'Gerenciamento de Projetos',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>`,
      description: 'Organize suas iniciativas de conformidade LGPD por projeto com acompanhamento de progresso.'
    },
    {
      name: 'Orientação para Desenvolvedores',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
      description: 'Dicas práticas e exemplos técnicos para implementar a conformidade com a LGPD no seu código.'
    },
  ];

  constructor(
    private projectsService: ProjectsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadProjectStats();
    }
  }

  loadProjectStats(): void {
    this.projectsService.getProjects().subscribe({
      next: (projects: Project[]) => {
        this.totalProjects = projects.length;
        this.completedProjects = projects.filter(p => p.status?.toLowerCase() === 'completo').length;
        this.inProgressProjects = projects.filter(p => p.status?.toLowerCase() === 'em progresso').length;
        this.pendingProjects = projects.filter(p => !p.status || p.status.toLowerCase() === 'pendente').length;
      },
      error: (err) => {
        console.error('Erro ao carregar projetos no dashboard:', err);
      }
    });
  }

  // Métodos de navegação
  navigateToProjects(): void {
    this.router.navigate(['/projects']);
  }
}

