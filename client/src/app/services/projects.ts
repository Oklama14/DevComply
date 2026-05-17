import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// 1. Adicione a propriedade 'status' à interface Project
export interface Project {
  id: number;
  nome: string;
  descricao: string;
  progresso: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectsService {
  private apiUrl = `${environment.apiUrl}/projects`;
  private http = inject(HttpClient);

  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(this.apiUrl);
  }

  createProject(project: { nome: string; descricao: string }): Observable<Project> {
    return this.http.post<Project>(this.apiUrl, project);
  }

  update(id: number, dto: Partial<Project>): Observable<Project> {
    return this.http.patch<Project>(`${this.apiUrl}/${id}`, dto);
  }

  updateProgress(id: number, progresso: number): Observable<Project> {
    return this.update(id, { progresso });
  }
}
