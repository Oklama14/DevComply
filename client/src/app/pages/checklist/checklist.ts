import { Component, OnInit } from '@angular/core';
import { ChecklistService, ChecklistCategory, ChecklistItem } from '../../services/checklist';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-checklist',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatExpansionModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './checklist.html',
  styleUrls: ['./checklist.scss']
})
export class Checklist implements OnInit {
  checklistData: ChecklistCategory[] = [];
  private projectId: string | null = null;

  constructor(
    private checklistService: ChecklistService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Captura o ID do projeto da URL
    this.projectId = this.route.snapshot.paramMap.get('projectId');
    if (this.projectId) {
      this.loadChecklistData();
    } else {
      console.error("ID do projeto não encontrado na URL.");
    }
  }

  loadChecklistData(): void {
    if (!this.projectId) return;

    // Usa forkJoin para esperar que ambas as chamadas à API terminem
    forkJoin({
      structure: this.checklistService.getChecklistData(),
      responses: this.checklistService.getChecklistResponses(this.projectId)
    }).subscribe({
      next: ({ structure, responses }) => {
        // Mapeia as respostas para fácil acesso (ex: { '15': { checked: true, ... } })
        const responseMap = new Map(
          responses.map(r => [r.pergunta.id, r])
        );

        // Mescla as respostas salvas com a estrutura do checklist
        structure.forEach(category => {
          category.items.forEach(item => {
            const questionId = parseInt(item.id.replace('item_', ''), 10);
            const response = responseMap.get(questionId);
            if (response) {
              item.checked = response.conformidade;
              item.implementationDetails = response.resposta || '';
              // Adapte para outros campos se necessário, como technicalDetails
            }
          });
        });

        this.checklistData = structure;
      },
      error: (err) => {
        console.error('Erro ao carregar dados do checklist:', err);
      }
    });
  }

  saveProgress(): void {
    if (!this.projectId) {
      console.error("ID do projeto não encontrado, impossível salvar.");
      return;
    }

    // Transforma os dados do checklist para o formato que a API espera
    const itemsToSave = this.checklistData.flatMap(category =>
      category.items.map(item => ({
        id: item.id,
        checked: item.checked,
        implementationDetails: item.implementationDetails,
        technicalDetails: item.technicalDetails
      }))
    );

    this.checklistService.saveChecklistResponses(this.projectId, itemsToSave)
      .subscribe({
        next: (response) => {
          console.log('Progresso salvo com sucesso!', response);
          // notificação de sucessopara o utilizador
        },
        error: (err) => {
          console.error('Erro ao salvar o progresso:', err);

        }
      });
  }

  onCheckboxChange(item: ChecklistItem): void {
    item.checked = !item.checked;
    // lógica extra, como atualizar estado no backen
  }
}
