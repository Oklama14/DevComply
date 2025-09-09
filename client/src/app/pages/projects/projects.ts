import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProjectsService, Project } from '../../services/projects';
import { NewProjectModal } from '../../components/new-project-modal/new-project-modal';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, NewProjectModal],
  templateUrl: './projects.html',
  styleUrls: ['./projects.scss']
})
export class Projects implements OnInit {
  projects: Project[] = [];
  isModalOpen = false;

  private platformId = inject(PLATFORM_ID);
  private projectsService = inject(ProjectsService);
  private router = inject(Router);

  ngOnInit(): void {
    // Apenas executa o código se estiver no ambiente do navegador
    if (isPlatformBrowser(this.platformId)) {
      this.loadProjects();
    }
  }

  loadProjects(): void {
    this.projectsService.getProjects().subscribe({
      next: (data: Project[]) => {
        this.projects = data;
      },
      error: (err: any) => {
        console.error('Erro ao carregar projetos:', err);
      }
    });
  }

  openNewProjectModal(): void {
    this.isModalOpen = true;
  }

  closeNewProjectModal(): void {
    this.isModalOpen = false;
  }

  handleCreateProject(newProject: { nome: string; descricao: string }): void {
    this.projectsService.createProject(newProject).subscribe({
      next: () => {
        this.loadProjects(); // Recarrega a lista após a criação
        this.closeNewProjectModal();
      },
      error: (err: any) => {
        console.error('Erro ao criar projeto:', err);
      }
    });
  }
  
  startChecklist(projectId: number): void {
    this.router.navigate(['/checklist', projectId]);
  }
}
