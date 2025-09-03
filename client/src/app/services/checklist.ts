import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Mantemos as interfaces para tipagem forte
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
  private apiUrl = 'http://localhost:3000/checklist'; // URL da nossa API

  constructor(private http: HttpClient) { }

  // Agora, este método busca os dados da API
  getChecklistData(): Observable<ChecklistCategory[]> {
    return this.http.get<ChecklistCategory[]>(this.apiUrl).pipe(
      catchError(this.handleError<ChecklistCategory[]>('getChecklistData', []))
    );
  }

  // Função de tratamento de erros para manter a aplicação a funcionar
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      // Retorna um resultado vazio para que a aplicação não quebre
      return of(result as T);
    };
  }
}
