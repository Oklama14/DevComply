import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Project } from './projects';

export interface ChecklistItem {
  id: number;
  titulo: string;
  descricao?: string;
  completed: boolean;
  lgpdReference?: string;
  tipText?: string;
}

export interface ChecklistCategory {
  id: number;
  nome: string;
  descricao?: string;
  items: ChecklistItem[];
}

@Injectable({ providedIn: 'root' })
export class ChecklistService {
  private apiUrl = 'http://localhost:3000';  

  constructor(private http: HttpClient) {}

  /** Estrutura/perguntas do checklist ( backend: GET /checklist/questions) */
  getChecklistStructure(): Observable<ChecklistCategory[]> {
    return this.http.get<ChecklistCategory[]>(`${this.apiUrl}/checklist/questions`);
  }

  /** Projeto */
  getProjectById(projectId: number): Observable<Project> {
    return this.http.get<Project>(`${this.apiUrl}/projects/${projectId}`);
  }

  /** Respostas do projeto ( backend: GET /checklist/project/:id) */
  getChecklistResponses(projectId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/checklist/project/${projectId}`);
  }

  /** Salvar respostas ( backend: POST /checklist/project/:id) */
  saveChecklistResponses(projectId: number, responses: any[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/checklist/project/${projectId}`, responses);
  }

// Envia o arquivo JSON (multipart/form-data)
sendChecklistReportFile(form: FormData) {
  return this.http.post(`${this.apiUrl}/reports/checklist`, form, {
    responseType: 'blob'
  });
}

}
