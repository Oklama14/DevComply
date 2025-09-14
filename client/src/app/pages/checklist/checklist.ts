import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, timeout } from 'rxjs/operators';

import { ChecklistService, ChecklistCategory, ChecklistItem } from '../../services/checklist';
import { Project } from '../../services/projects';

type DisplayableChecklistItem = ChecklistItem & {
  expanded: boolean;
  answer: string;
  technicalDetails: string;
};

type DisplayableChecklistCategory = Omit<ChecklistCategory, 'items'> & {
  items: DisplayableChecklistItem[];
  progress?: number;
};

@Component({
  selector: 'app-checklist',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checklist.html',
  styleUrls: ['./checklist.scss']
})
export class Checklist implements OnInit {
  platformId = inject(PLATFORM_ID);
  projectId: number | null = null;
  project: Project | null = null;
  checklistData: DisplayableChecklistCategory[] = [];
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private checklistService: ChecklistService
  ) {}

  ngOnInit(): void {
    // sempre começar em loading
    this.isLoading = true;

    if (!isPlatformBrowser(this.platformId)) {
      console.warn('[Checklist] SSR detectado: evitando chamadas');
      this.isLoading = false;
      return;
    }

    this.route.paramMap.subscribe(params => {
      const raw = params.get('id');
      const id = raw ? +raw : NaN;

      if (!id || Number.isNaN(id)) {
        console.warn('[Checklist] :id ausente/ inválido', { raw });
        this.isLoading = false; // evita travar
        this.project = null;
        return;
      }

      this.projectId = id;
      this.loadChecklistData();
    });
  }

  loadChecklistData(): void {
    if (!this.projectId) {
      console.warn('[Checklist] loadChecklistData sem projectId');
      this.isLoading = false;
      return;
    }

    console.log('[Checklist] Carregando dados para projectId=', this.projectId);

    const project$ = this.checklistService.getProjectById(this.projectId).pipe(
      catchError(err => { console.error('[Checklist] getProjectById falhou', err); return of(null); })
    );

    const structure$ = this.checklistService.getChecklistStructure().pipe(
      catchError(err => { console.error('[Checklist] getChecklistStructure falhou', err); return of<ChecklistCategory[]>([]); })
    );

    const responses$ = this.checklistService.getChecklistResponses(this.projectId).pipe(
      catchError(err => { console.error('[Checklist] getChecklistResponses falhou', err); return of<any[]>([]); })
    );

    forkJoin({ project: project$, structure: structure$, responses: responses$ })
      .pipe(
        timeout(15000),            // evita pending infinito
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: ({ project, structure, responses }) => {
          console.log('[Checklist] OK', { project, structureLen: structure?.length, responsesLen: responses?.length });
          this.project = project ?? null;

          const responseMap = new Map(responses?.map((r: any) => [r.perguntaId, r]) ?? []);

          this.checklistData = (structure ?? []).map(category => {
            const items = (category.items ?? []).map(item => {
              const r = responseMap.get(item.id);
              return {
                ...item,
                // garante boolean “de verdade”
                completed: !!r?.conformidade,
                answer: r?.resposta ?? '',
                technicalDetails: r?.detalhesTecnicos ?? '',
                expanded: false
              } as DisplayableChecklistItem;
            });

            return {
              ...category,
              items,
              progress: this.calculateCategoryProgress(items, responseMap)
            } as DisplayableChecklistCategory;
          });
        },
        error: (err) => {
          console.error('[Checklist] Falha geral (timeout ou erro não tratado no forkJoin)', err);
          // isLoading volta a false no finalize
        }
      });
  }

  get overallProgress(): number {
    if (!this.checklistData?.length) return 0;
    const total = this.checklistData.reduce((acc, c) => acc + (c.items?.length || 0), 0);
    if (!total) return 0;
    const done = this.checklistData.reduce((acc, c) => acc + c.items.filter(i => i.completed).length, 0);
    return Math.round((done / total) * 100);
    }

  calculateCategoryProgress(
    items: ChecklistItem[] | DisplayableChecklistItem[],
    responseMap: Map<number, any>
  ): number {
    if (!items || items.length === 0) return 0;
    const completed = items.filter((it: any) =>
      (responseMap.get(it.id)?.conformidade) || it.completed === true
    ).length;
    return Math.round((completed / items.length) * 100);
  }

  toggleItemExpansion(item: DisplayableChecklistItem): void {
    item.expanded = !item.expanded;
  }

  saveProgress(): void {
    if (!this.projectId) return;

    const responsesToSave = this.checklistData.flatMap(category =>
      category.items.map(item => ({
        perguntaId: item.id,
        resposta: item.answer ?? '',
        detalhesTecnicos: item.technicalDetails ?? '',
        conformidade: !!item.completed
      }))
    );

    this.checklistService.saveChecklistResponses(this.projectId, responsesToSave).subscribe({
      next: () => console.log('Progresso salvo com sucesso!'),
      error: (err) => console.error('Erro ao salvar progresso:', err)
    });
  }

  // stubs opcionais para ligar a UI (se usar no HTML)
  generateReport(): void {
    console.log('[Checklist] Gerar relatório — implemente a rota/serviço de export.');
  }

  showTip(item: DisplayableChecklistItem): void {
    // pode abrir um modal, toast etc. Por enquanto apenas log.
    if (item.tipText) console.log('[Checklist] Dica:', item.tipText);
  }
}
