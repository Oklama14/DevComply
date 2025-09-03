import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectsService, Project } from '../../services/projects';
import { NewProjectModal } from '../../components/new-project-modal/new-project-modal';

@Component({
  selector: 'app-projects',
  standalone: true,
  // 1. Importe o NewProjectModal aqui para que o template o reconheça
  imports: [CommonModule, NewProjectModal],
  templateUrl: './projects.html',
  styleUrls: ['./projects.scss']
})
export class Projects implements OnInit {
  projects: Project[] = [];
  isLoading = true;
  // 2. Declare a propriedade para controlar a visibilidade do modal
  isModalOpen = false;

  constructor(private projectsService: ProjectsService) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.isLoading = true;
    this.projectsService.getProjects().subscribe({
      next: (data: Project[]) => {
        this.projects = data;
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Erro ao carregar projetos:', err);
        this.isLoading = false;
      }
    });
  }

  // 3. Declare os métodos que o template está a chamar
  openNewProjectModal() {
    this.isModalOpen = true;
  }

  closeNewProjectModal() {
    this.isModalOpen = false;
  }

  handleCreateProject(projectData: { nome: string; descricao: string }) {
    this.projectsService.createProject(projectData).subscribe({
      next: (newProject: Project) => {
        this.projects.push(newProject); // Adiciona o novo projeto à lista
        this.closeNewProjectModal();
      },
      error: (err: any) => {
        console.error('Erro ao criar projeto:', err);
      }
    });
  }
}