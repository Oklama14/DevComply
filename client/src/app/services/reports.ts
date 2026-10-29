import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/** Numeros guardados de cada relatorio (ver api/src/reports/relatorio-historico.ts). */
export interface ResumoRelatorio {
  total: number;
  atende: number;
  parcial: number;
  nao_atende: number;
  nao_avaliado: number;
  nao_marcados: number;
  lacunas: {
    catastrofica: number;
    grave: number;
    leve: number;
    nao_implementado: number;
  };
  /** Codigos com lacuna, na ordem do checklist. */
  pendentes: string[];
}

export interface ItemHistorico {
  id: number;
  criadoEm: string;
  modelo: string | null;
  /** Indice de conformidade (0 a 100); null quando nenhum item foi avaliado. */
  pontuacao: number | null;
  resumo: ResumoRelatorio | null;
}

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/reports`;

  /** Historico do projeto, do mais recente para o mais antigo. */
  listarHistorico(projectId: number): Observable<ItemHistorico[]> {
    return this.http.get<ItemHistorico[]>(`${this.apiUrl}/project/${projectId}`);
  }

  /** O PDF montado de novo a partir do que ficou guardado (nao chama a IA). */
  baixarPdf(projectId: number, reportId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/project/${projectId}/${reportId}/pdf`, {
      responseType: 'blob',
    });
  }

  excluir(projectId: number, reportId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/project/${projectId}/${reportId}`);
  }
}
