import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChecklistService, ChecklistCategory } from '../../services/checklist';

@Component({
  selector: 'app-checklist',
  standalone: true,
  imports: [CommonModule],
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
      next: (data) => {
        this.checklistCategories = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar checklist:', err);
        this.isLoading = false;
      }
    });
  }
}
