import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin, of, switchMap } from 'rxjs';
import { catchError, finalize, timeout } from 'rxjs/operators';
import { ChecklistService, ChecklistCategory, ChecklistItem } from '../../services/checklist';
import { Project, ProjectsService } from '../../services/projects'
import { Location } from '@angular/common';


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
  isGeneratingReport = false;

  constructor(
    private route: ActivatedRoute,
    private checklistService: ChecklistService,
    private projectsService: ProjectsService,
    private router: Router,
    private location: Location
  ) {}


  goBack(): void {
  this.location.back();
}
  ngOnInit(): void {
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
        this.isLoading = false;
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
        timeout(15000),
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

  const progresso = Number(this.overallProgress) || 0;


  this.checklistService.saveChecklistResponses(this.projectId, responsesToSave)
    .pipe(
      switchMap(() =>
        this.projectsService.update(this.projectId!, { progresso })
      )
    )
    .subscribe({
      next: () => console.log('Respostas salvas e progresso do projeto atualizado!'),
      error: (err) => console.error('Falha ao salvar respostas/atualizar progresso:', err),
    });
}

  showTip(item: DisplayableChecklistItem): void {
    if (item.tipText) console.log('[Checklist] Dica:', item.tipText);
  }

  generateReport(): void {
  const payload = (this.checklistData || [])
    .map(cat => {
      const checked = (cat.items || []).filter(i => !!i.completed);
      if (checked.length === 0) return null;

      return {
        categoria_nome: cat.nome,
        items: checked.map(i => ({
          titulo_item: i.titulo,
          resposta_implementacao: i.answer ?? '',
          resposta_tecnica: i.technicalDetails ?? '',
          artigo_referente: i.lgpdReference ?? undefined
        }))
      };
    })
    .filter(Boolean) as Array<{ categoria_nome: string; items: any[] }>;

  if (!payload.length) {
    console.warn('[Relatório] Nenhum item marcado — nada para enviar.');
    return;
  }

  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const filename = `checklist-${this.project?.id ?? 'sem-projeto'}.json`;

  const form = new FormData();
  form.append('file', blob, filename);
  if (this.projectId) form.append('projectId', String(this.projectId));
  if (this.project?.nome) form.append('projectName', this.project.nome);

  this.isGeneratingReport = true; 

  this.checklistService.sendChecklistReportFile(form).subscribe({
    next: (pdfBlob: Blob) => {
      console.log('[Relatório] PDF recebido com sucesso');
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-lgpd-${this.project?.id ?? 'sem-projeto'}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      this.isGeneratingReport = false; 
    },
    error: (err: any) => {
      console.error('[Relatório] Falha ao enviar', err);
      this.isGeneratingReport = false; 
    },
    complete: () => {
      this.isGeneratingReport = false; 
    }
  });
}
}