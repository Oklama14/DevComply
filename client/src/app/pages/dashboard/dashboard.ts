import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProjectsService, Project } from '../../services/projects';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface Feature {
  name: string;
  description: string;
  svg: SafeHtml;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class Dashboard implements OnInit {
  totalProjects: number = 0;
  completedProjects: number = 0;
  inProgressProjects: number = 0;
  pendingProjects: number = 0;
  features: Feature[] = [];

  private platformId = inject(PLATFORM_ID);
  private projectsService = inject(ProjectsService);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);

  constructor() {
    const rawFeatures = [
      {
        name: 'Checklist Interativo',
        description: 'Lista detalhada de requisitos LGPD específicos para desenvolvedores.',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`
      },
      {
        name: 'Análise de Conformidade',
        description: 'Avaliação automatizada das suas implementações com recomendações.',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`
      }
    ];
    this.features = rawFeatures.map(feature => ({
      ...feature,
      svg: this.sanitizer.bypassSecurityTrustHtml(feature.svg)
    }));
  }

  ngOnInit(): void {
    // Apenas executa o código se estiver no ambiente do navegador
    if (isPlatformBrowser(this.platformId)) {
      this.projectsService.getProjects().subscribe({
        next: (data: Project[]) => {
          this.totalProjects = data.length;
          this.completedProjects = data.filter(p => p.status === 'Completo').length;
          this.inProgressProjects = data.filter(p => p.status === 'Em Progresso').length;
          this.pendingProjects = data.filter(p => p.status === 'Pendente').length;
        },
        error: (err) => {
          console.error('Erro ao carregar projetos no dashboard:', err);
        }
      });
    }
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }
}

