import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Definindo as interfacees para tipar os nossos dados, garantindo consistência
export interface ChecklistItem {
  id: string;
  text: string;
  details: string;
  article: string;
  checked: boolean;
  implementationDetails: string;
  technicalDetails: string;
}

export interface ChecklistCategory {
  id: string;
  name: string;
  items: ChecklistItem[];
}

@Injectable({
  providedIn: 'root'
})
export class ChecklistService {
  private apiUrl = 'http://localhost:3000/checklist';

  constructor(private http: HttpClient) { }

  getChecklistData(): Observable<ChecklistCategory[]> {
    return this.http.get<ChecklistCategory[]>(this.apiUrl);
  }
  
  // Novo método para buscar as respostas salvas
  getChecklistResponses(projectId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/responses/${projectId}`);
  }

  saveChecklistResponses(projectId: string, items: any[]): Observable<any> {
    const payload = { items };
    return this.http.post(`${this.apiUrl}/responses/${projectId}`, payload);
  }
}
