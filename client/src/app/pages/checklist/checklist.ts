import { Component, NgZone, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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

type Feedback = { type: 'success' | 'error' | 'info'; message: string };

@Component({
  selector: 'app-checklist',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './checklist.html',
  styleUrls: ['./checklist.scss']
})
export class Checklist implements OnInit {
  platformId = inject(PLATFORM_ID);
  private zone = inject(NgZone);
  projectId: number | null = null;
  project: Project | null = null;
  checklistData: DisplayableChecklistCategory[] = [];
  isLoading = true;
  isGeneratingReport = false;
  isSaving = false;
  feedback: Feedback | null = null;

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

  /** Atualiza o % da secao assim que um item e marcado/desmarcado. */
  onItemToggled(category: DisplayableChecklistCategory): void {
    const total = category.items?.length || 0;
    const done = category.items.filter(i => i.completed).length;
    category.progress = total ? Math.round((done / total) * 100) : 0;
  }

saveProgress(): void {
  if (!this.projectId || this.isSaving) return;

  const responsesToSave = this.checklistData.flatMap(category =>
    category.items.map(item => ({
      perguntaId: item.id,
      resposta: item.answer ?? '',
      detalhesTecnicos: item.technicalDetails ?? '',
      conformidade: !!item.completed
    }))
  );

  const progresso = Number(this.overallProgress) || 0;

  this.isSaving = true;
  this.checklistService.saveChecklistResponses(this.projectId, responsesToSave)
    .pipe(
      switchMap(() =>
        this.projectsService.update(this.projectId!, { progresso })
      ),
      finalize(() => this.isSaving = false)
    )
    .subscribe({
      next: () => this.feedback = { type: 'success', message: 'Progresso salvo.' },
      error: (err) => {
        console.error('Falha ao salvar respostas/atualizar progresso:', err);
        this.feedback = { type: 'error', message: 'Não foi possível salvar o progresso. Tente novamente.' };
      },
    });
}

  generateReport(): void {
  if (this.isGeneratingReport) return;

  const payload = (this.checklistData || [])
    .map(cat => {
      const checked = (cat.items || []).filter(i => !!i.completed);
      if (checked.length === 0) return null;

      return {
        categoria_nome: cat.nome,
        items: checked.map(i => ({
          codigo: i.codigo ?? undefined,
          titulo_item: i.titulo,
          resposta_implementacao: i.answer ?? '',
          resposta_tecnica: i.technicalDetails ?? '',
          artigo_referente: i.lgpdReference ?? undefined
        }))
      };
    })
    .filter(Boolean) as Array<{ categoria_nome: string; items: any[] }>;

  if (!payload.length) {
    // Antes so ia para o console e o botao parecia nao funcionar.
    this.feedback = {
      type: 'info',
      message: 'Marque ao menos um item do checklist (e descreva a implementação) para gerar o relatório.'
    };
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
  this.feedback = { type: 'info', message: 'Gerando o relatório com IA. Isso pode levar alguns segundos…' };

  this.checklistService.sendChecklistReportFile(form)
    .pipe(finalize(() => this.isGeneratingReport = false))
    .subscribe({
      next: (pdfBlob: Blob) => {
        const url = window.URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio-lgpd-${this.project?.id ?? 'sem-projeto'}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.feedback = { type: 'success', message: 'Relatório gerado. O download do PDF foi iniciado.' };
      },
      error: (err: any) => {
        console.error('[Relatório] Falha ao enviar', err);
        this.feedback = { type: 'error', message: 'Não foi possível gerar o relatório. Tente novamente em instantes.' };
        // Ler o Blob e assincrono (Promise nativa, fora da zona): volta para a zona
        // para o Angular atualizar a tela com a mensagem da API.
        this.reportErrorMessage(err).then(message =>
          this.zone.run(() => this.feedback = { type: 'error', message })
        );
      },
    });
}

  /** Com responseType 'blob', o corpo do erro (JSON da API) tambem chega como Blob. */
  private async reportErrorMessage(err: any): Promise<string> {
    const fallback = 'Não foi possível gerar o relatório. Tente novamente em instantes.';
    try {
      const body = err?.error instanceof Blob ? JSON.parse(await err.error.text()) : err?.error;
      const msg = Array.isArray(body?.message) ? body.message.join(' ') : body?.message;
      return typeof msg === 'string' && msg.trim() ? msg : fallback;
    } catch {
      return fallback;
    }
  }
}