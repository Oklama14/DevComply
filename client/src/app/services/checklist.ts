import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Project } from './projects';
import { environment } from '../../environments/environment';

export interface ChecklistItem {
  id: number;
  codigo?: string;        // codigo do item no LGPD-Check (ex.: "S-17")
  titulo: string;
  descricao?: string;
  completed: boolean;
  lgpdReference?: string; // artigos da LGPD (ex.: "Art. 18, V")
  tipText?: string;       // recomendacao do LGPD-Check
  obrigatorio?: boolean;  // false = item opcional (boa pratica)
}

/** Item de `devcomply/declaracoes/1`, o formato que a lgpd-scan le. */
export interface DeclaracaoItem {
  codigo: string;
  secao: string;
  pergunta: string;
  marcado: boolean;
  implementacao?: string;
  tecnico?: string;
}

export interface DeclaracoesExport {
  schema: string;
  projeto: string | null;
  gerado_em: string;
  aviso: string;
  itens: DeclaracaoItem[];
}

export interface ChecklistCategory {
  id: number;
  nome: string;
  descricao?: string;
  items: ChecklistItem[];
}

@Injectable({ providedIn: 'root' })
export class ChecklistService {
  private apiUrl = environment.apiUrl;  

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

  /** Declaracoes do checklist para a lgpd-scan (backend: GET /checklist/project/:id/declaracoes) */
  getDeclaracoes(projectId: number): Observable<DeclaracoesExport> {
    return this.http.get<DeclaracoesExport>(`${this.apiUrl}/checklist/project/${projectId}/declaracoes`);
  }

// Envia o arquivo JSON (multipart/form-data)
sendChecklistReportFile(form: FormData) {
  return this.http.post(`${this.apiUrl}/reports/checklist`, form, {
    responseType: 'blob'
  });
}

}
