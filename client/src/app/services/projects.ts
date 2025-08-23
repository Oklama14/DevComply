import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// (Opcional) Crie uma interface para tipar os seus projetos
export interface Project {
  id: number;
  nome: string;
  descricao: string;
  // Adicione outras propriedades se necessário
}

@Injectable({
  providedIn: 'root'
})
export class ProjectsService {
  private apiUrl = 'http://localhost:3000/projects';

  constructor(private http: HttpClient) { }

  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(this.apiUrl);
  }

  createProject(projectData: { nome: string; descricao: string }): Observable<Project> {
    return this.http.post<Project>(this.apiUrl, projectData);
  }

  // Adicione os métodos update e delete aqui no futuro
}
