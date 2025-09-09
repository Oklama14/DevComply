import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// 1. Adicione a propriedade 'status' à interface Project
export interface Project {
  id: number;
  nome: string;
  descricao: string;
  status: string; // Pode ser 'Completo', 'Em Progresso', 'Pendente', etc.
}

@Injectable({
  providedIn: 'root'
})
export class ProjectsService {
  private apiUrl = 'http://localhost:3000/projects';
  private http = inject(HttpClient);

  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(this.apiUrl);
  }

  createProject(project: { nome: string; descricao: string }): Observable<Project> {
    return this.http.post<Project>(this.apiUrl, project);
  }
}
