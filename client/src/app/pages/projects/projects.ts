import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
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
  platformId = inject(PLATFORM_ID);
  projects: Project[] = [];
  isModalOpen = false;

  constructor(
    private projectsService: ProjectsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadProjects();
    }
  }

  loadProjects(): void {
    this.projectsService.getProjects().subscribe({
      next: (data: Project[]) => {
        this.projects = data;
      },
      error: (err) => {
        console.error('Erro ao carregar projetos', err);
      }
    });
  }

  handleCreateProject(newProject: { nome: string; descricao: string }): void {
    this.projectsService.createProject(newProject).subscribe({
      next: (createdProject) => {
        this.projects.push(createdProject);
        this.closeNewProjectModal();
      },
      error: (err) => {
        console.error('Erro ao criar projeto', err);
      }
    });
  }

  openNewProjectModal(): void {
    this.isModalOpen = true;
  }

  closeNewProjectModal(): void {
    this.isModalOpen = false;
  }

  startChecklist(projectId: number): void {
    this.router.navigate(['/checklist', projectId]);
  }
}
