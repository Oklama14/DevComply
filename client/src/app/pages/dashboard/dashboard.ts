import { Component, OnInit, SecurityContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ProjectsService } from '../../services/projects';

interface Feature {
  name: string;
  description: string;
  svg: SafeHtml;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class Dashboard implements OnInit {
  totalProjects = 0;
  completedProjects = 0;
  inProgressProjects = 0;
  pendingProjects = 0;
  
  features: Feature[] = [];

  constructor(
    private projectsService: ProjectsService,
    private sanitizer: DomSanitizer
  ) {
    this.initializeFeatures();
  }

  ngOnInit(): void {
    this.projectsService.getProjects().subscribe(projects => {
      this.totalProjects = projects.length;
      // Adicionar lógica para contar status quando implementado
      this.pendingProjects = projects.length; 
    });
  }

  private initializeFeatures(): void {
    const iconSize = 'width="24" height="24"';
    const iconStyle = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
    
    this.features = [
      {
        name: 'Checklist Interativo',
        description: 'Lista detalhada de requisitos LGPD específicos para desenvolvedores com orientações técnicas.',
        svg: this.sanitizeSvg(`<svg ${iconSize} ${iconStyle}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>`)
      },
      {
        name: 'Análise de Conformidade',
        description: 'Avaliação automatizada das suas implementações com recomendações técnicas específicas.',
        svg: this.sanitizeSvg(`<svg ${iconSize} ${iconStyle}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`)
      },
      {
        name: 'Gerenciamento de Projetos',
        description: 'Organize suas iniciativas de conformidade LGPD por projeto com acompanhamento de progresso.',
        svg: this.sanitizeSvg(`<svg ${iconSize} ${iconStyle}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>`)
      },
      {
        name: 'Orientação para Desenvolvedores',
        description: 'Dicas práticas e exemplos técnicos para implementar a conformidade com a LGPD no seu código.',
        svg: this.sanitizeSvg(`<svg ${iconSize} ${iconStyle}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6m-3-3h6"/></svg>`)
      },
    ];
  }

  private sanitizeSvg(svg: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }
}
