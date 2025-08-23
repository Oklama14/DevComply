import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

// Interfaces para tipar os nossos dados
export interface ChecklistItem {
  id: string;
  text: string;
  details: string;
  article: string;
  checked: boolean;
  implementationDetails?: string;
  technicalDetails?: string;
}

export interface ChecklistCategory {
  id: string;
  name: string;
  description: string;
  items: ChecklistItem[];
}

@Injectable({
  providedIn: 'root'
})
export class ChecklistService {

  constructor() { }

  // No futuro, este método fará uma chamada HTTP para a sua API NestJS.
  // Por agora, ele retorna dados de exemplo (mock data).
  getChecklistData(): Observable<ChecklistCategory[]> {
    const mockData: ChecklistCategory[] = [
      {
        id: 'cat1',
        name: 'Princípios de Transparência',
        description: 'Avaliação da transparência e informação aos titulares de dados.',
        items: [
          { id: 'item1', text: 'O sistema possui uma política de privacidade clara e acessível?', details: 'A política de privacidade deve ser facilmente encontrada e compreendida pelos utilizadores.', article: 'Art. 6º, VI e Art. 9º', checked: false },
          { id: 'item2', text: 'Os utilizadores são informados sobre a finalidade específica da coleta de dados?', details: 'O sistema deve comunicar claramente por que cada dado pessoal está sendo coletado.', article: 'Art. 6º, I e Art. 9º, I', checked: false },
          { id: 'item3', text: 'Existe um mecanismo para obter e registar o consentimento dos utilizadores?', details: 'O consentimento deve ser livre, informado e inequívoco.', article: 'Art. 7º, I e Art. 8º', checked: false },
        ]
      },
      {
        id: 'cat2',
        name: 'Segurança de Dados',
        description: 'Análise das medidas técnicas e organizacionais de segurança.',
        items: [
          { id: 'item4', text: 'O sistema implementa criptografia para dados sensíveis?', details: 'Dados sensíveis devem ser criptografados tanto em trânsito quanto em repouso.', article: 'Art. 46 e Art. 47', checked: false },
          { id: 'item5', text: 'Existe um processo definido para resposta a incidentes de segurança?', details: 'Deve haver um plano documentado para lidar com vazamentos de dados.', article: 'Art. 48', checked: false },
        ]
      }
    ];
    return of(mockData); // 'of()' cria um Observable a partir dos dados de exemplo.
  }
}
