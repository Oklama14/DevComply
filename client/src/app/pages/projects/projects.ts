import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'; // 1. Importar o Router
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

  // 2. Injetar o Router no construtor
  constructor(
    private projectsService: ProjectsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProjects();
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

  handleCreateProject(newProject: { nome: string; descricao: string }): void {
    this.projectsService.createProject(newProject).subscribe({
      next: (createdProject: Project) => {
        this.projects.push(createdProject);
        this.isModalOpen = false;
      },
      error: (err: any) => {
        console.error('Erro ao criar projeto:', err);
      }
    });
  }

  // 3. Criar o método que realiza a navegação
  startChecklist(projectId: number): void {
    // Navega para a rota do checklist, passando o ID do projeto
    this.router.navigate(['/checklist', projectId]);
  }
}
