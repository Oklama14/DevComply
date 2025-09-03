import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChecklistService, ChecklistCategory, ChecklistItem } from '../../services/checklist';
// 1. Importe o MatExpansionModule
import { MatExpansionModule } from '@angular/material/expansion';

@Component({
  selector: 'app-checklist',
  standalone: true,
  // 2. Adicione o MatExpansionModule às importações do componente
  imports: [CommonModule, FormsModule, MatExpansionModule],
  templateUrl: './checklist.html',
  styleUrls: ['./checklist.scss']
})
export class Checklist implements OnInit {
  checklistCategories: ChecklistCategory[] = [];
  isLoading = true;

  constructor(private checklistService: ChecklistService) {}

  ngOnInit(): void {
    this.loadChecklist();
  }

  loadChecklist(): void {
    this.isLoading = true;
    this.checklistService.getChecklistData().subscribe({
      next: (data: ChecklistCategory[]) => {
        this.checklistCategories = data;
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Erro ao carregar checklist:', err);
        this.isLoading = false;
      }
    });
  }

  onCheckboxChange(item: ChecklistItem): void {
    console.log('Item alterado:', item.id, 'Novo estado:', item.checked);
  }
}
