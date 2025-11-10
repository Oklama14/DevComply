import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { ProjectsService, Project } from '../../services/projects';
import { NewProjectModal } from '../../components/new-project-modal/new-project-modal';
import { Location } from '@angular/common';
import { ProgressStatusPipe } from '../../pipes/progress-status.pipe';


@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, NewProjectModal, ProgressStatusPipe],
  templateUrl: './projects.html',
  styleUrls: ['./projects.scss']
})
export class Projects implements OnInit {
  platformId = inject(PLATFORM_ID);
  projects: Project[] = [];
  isModalOpen = false;
  formId: number | null = null;
  formNome = '';
  formDescricao = '';

  constructor(
    private projectsService: ProjectsService,
    private router: Router,
    private location: Location,

  ) { }

  goBack(): void {
    this.location.back();
  }
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

handleSaveProject(data: { id?: number; nome: string; descricao: string }) {
  if (data.id) {
    // update path
    this.projectsService.update(data.id, { nome: data.nome, descricao: data.descricao })
      .subscribe({
        next: (updated) => {
          const i = this.projects.findIndex(p => p.id === updated.id);
          if (i > -1) this.projects[i] = { ...this.projects[i], ...updated };
          this.closeModal();
        },
        error: (e) => console.error('Erro ao atualizar', e)
      });
  } else {
    // create path
    this.projectsService.createProject({ nome: data.nome, descricao: data.descricao })
      .subscribe({
        next: (created) => { this.projects.unshift(created); this.closeModal(); },
        error: (e) => console.error('Erro ao criar', e)
      });
  }
}
  openCreateModal() {
    this.formId = null;
    this.formNome = '';
    this.formDescricao = '';
    this.isModalOpen = true;
  }

  openEditModal(id: number, nome: string, descricao: string) {
    this.formId = id;
    this.formNome = nome;
    this.formDescricao = descricao;
    this.isModalOpen = true;
  }

  closeModal() { this.isModalOpen = false; }


  startChecklist(projectId: number): void {
    this.router.navigate(['/checklist', projectId]);
  }
}