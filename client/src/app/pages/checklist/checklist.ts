import { Component, DestroyRef, HostListener, NgZone, OnDestroy, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EMPTY, Observable, Subject, concat, defer, forkJoin, of, switchMap, throwError } from 'rxjs';
import { catchError, concatMap, debounceTime, finalize, ignoreElements, tap, timeout } from 'rxjs/operators';
import { ChecklistService, ChecklistCategory, ChecklistItem, DeclaracoesExport } from '../../services/checklist';
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

type EstadoSalvamento = 'idle' | 'pendente' | 'salvando' | 'salvo' | 'erro';

/** Espera depois da ultima alteracao antes de salvar sozinho. */
const ESPERA_AUTOSAVE_MS = 1500;

/** Nome que o comando da lgpd-scan espera (`--declaracoes devcomply-declaracoes.json`). */
const ARQUIVO_DECLARACOES = 'devcomply-declaracoes.json';

@Component({
  selector: 'app-checklist',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './checklist.html',
  styleUrls: ['./checklist.scss']
})
export class Checklist implements OnInit, OnDestroy {
  platformId = inject(PLATFORM_ID);
  private zone = inject(NgZone);
  private destroyRef = inject(DestroyRef);
  projectId: number | null = null;
  project: Project | null = null;
  checklistData: DisplayableChecklistCategory[] = [];
  isLoading = true;
  isGeneratingReport = false;
  isExportingDeclaracoes = false;
  // Andamento do relatorio: quantos itens foram para a IA, quantos entram como
  // lacuna e ha quanto tempo.
  itensIaRelatorio = 0;
  itensLacunaRelatorio = 0;
  segundosRelatorio = 0;
  private relogioRelatorio?: ReturnType<typeof setInterval>;

  get tempoRelatorio(): string {
    const m = Math.floor(this.segundosRelatorio / 60);
    const s = this.segundosRelatorio % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }
  feedback: Feedback | null = null;

  // Salvamento automatico: cada alteracao agenda um salvamento; os salvamentos
  // rodam em fila (concatMap) para nunca gravar uma versao velha por cima da nova.
  estadoSalvamento: EstadoSalvamento = 'idle';
  salvoEm: Date | null = null;
  private alteracoes$ = new Subject<void>();
  private versaoAlteracao = 0;

  get isSaving(): boolean {
    return this.estadoSalvamento === 'salvando';
  }

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

    this.alteracoes$
      .pipe(
        debounceTime(ESPERA_AUTOSAVE_MS),
        concatMap(() => this.persistir$()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  /** Chamado a cada alteracao do usuario (caixa marcada ou texto digitado). */
  marcarAlteracao(): void {
    if (!this.projectId) return;
    this.versaoAlteracao++;
    this.estadoSalvamento = 'pendente';
    this.alteracoes$.next();
  }

  /** Ao sair da tela com alteracoes ainda na espera, salva na hora. */
  ngOnDestroy(): void {
    this.pararRelogioRelatorio();
    if (this.estadoSalvamento === 'pendente') {
      this.persistir$().subscribe();
    }
  }

  /** Fechar/recarregar a aba com algo por salvar: o navegador pede confirmacao. */
  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    // Tambem durante o relatorio: fechar a aba perde o PDF que esta sendo gerado.
    if (this.estadoSalvamento === 'pendente' || this.estadoSalvamento === 'salvando' || this.isGeneratingReport) {
      event.preventDefault();
      event.returnValue = '';
    }
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
    this.marcarAlteracao();
  }

/** Grava todas as respostas e o progresso do projeto. */
  private persistir$(): Observable<unknown> {
    if (!this.projectId) return EMPTY;

    const versao = this.versaoAlteracao;
    const responsesToSave = this.checklistData.flatMap(category =>
      category.items.map(item => ({
        perguntaId: item.id,
        resposta: item.answer ?? '',
        detalhesTecnicos: item.technicalDetails ?? '',
        conformidade: !!item.completed
      }))
    );
    const progresso = Number(this.overallProgress) || 0;

    this.estadoSalvamento = 'salvando';
    // zone.run: com withFetch() a resposta pode chegar fora da zona do Angular e a
    // tela ficaria presa em "Salvando…" ate o proximo clique.
    return this.checklistService.saveChecklistResponses(this.projectId, responsesToSave).pipe(
      switchMap(() => this.projectsService.update(this.projectId!, { progresso })),
      tap(() => this.zone.run(() => {
        this.salvoEm = new Date();
        // Se o usuario mexeu de novo durante o envio, ainda ha algo na fila.
        this.estadoSalvamento = versao === this.versaoAlteracao ? 'salvo' : 'pendente';
      })),
      catchError(err => {
        console.error('Falha ao salvar respostas/atualizar progresso:', err);
        this.zone.run(() => this.estadoSalvamento = 'erro');
        return EMPTY;
      }),
    );
  }

  /** Botao "Salvar Progresso": salva na hora, sem esperar o automatico. */
  saveProgress(): void {
    if (!this.projectId || this.isSaving) return;
    this.persistir$().subscribe({
      complete: () => {
        this.feedback = this.estadoSalvamento === 'erro'
          ? { type: 'error', message: 'Não foi possível salvar o progresso. Tente novamente.' }
          : { type: 'success', message: 'Progresso salvo.' };
      },
    });
  }

  generateReport(): void {
  if (this.isGeneratingReport) return;

  // Vai o checklist inteiro: os itens marcados sao avaliados pela IA e os nao
  // marcados entram no relatorio como lacunas, com a recomendacao do LGPD-Check.
  const payload = (this.checklistData || []).map(cat => ({
    categoria_nome: cat.nome,
    items: (cat.items || []).map(i => ({
      codigo: i.codigo ?? undefined,
      titulo_item: i.titulo,
      resposta_implementacao: i.answer ?? '',
      resposta_tecnica: i.technicalDetails ?? '',
      artigo_referente: i.lgpdReference ?? undefined,
      marcado: !!i.completed,
    })),
  }));
  const todosItens = payload.flatMap(c => c.items);
  const marcados = todosItens.filter(i => i.marcado).length;

  if (!marcados) {
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
  this.itensIaRelatorio = marcados;
  this.itensLacunaRelatorio = todosItens.length - marcados;
  this.segundosRelatorio = 0;
  this.pararRelogioRelatorio();
  this.relogioRelatorio = setInterval(() => this.segundosRelatorio++, 1000);
  this.feedback = { type: 'info', message: 'Gerando o relatório…' };

  // zone.run: com withFetch() a resposta pode chegar fora da zona do Angular, e o
  // botao ficaria em "Gerando relatório…" ate o proximo clique.
  this.checklistService.sendChecklistReportFile(form)
    .pipe(finalize(() => this.zone.run(() => {
      this.isGeneratingReport = false;
      this.pararRelogioRelatorio();
    })))
    .subscribe({
      next: (pdfBlob: Blob) => this.zone.run(() => {
        const url = window.URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio-lgpd-${this.project?.id ?? 'sem-projeto'}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.feedback = { type: 'success', message: 'Relatório gerado. O download do PDF foi iniciado.' };
      }),
      error: (err: any) => {
        console.error('[Relatório] Falha ao enviar', err);
        this.zone.run(() => this.feedback = { type: 'error', message: 'Não foi possível gerar o relatório. Tente novamente em instantes.' });
        // Ler o Blob e assincrono (Promise nativa, fora da zona): volta para a zona
        // para o Angular atualizar a tela com a mensagem da API.
        this.reportErrorMessage(err).then(message =>
          this.zone.run(() => this.feedback = { type: 'error', message })
        );
      },
    });
}

  /**
   * Baixa as declaracoes no formato da lgpd-scan (devcomply/declaracoes/1). O arquivo
   * sai do que esta salvo na conta, entao uma alteracao ainda na fila e salva antes;
   * se o salvamento falhar, nao exporta uma versao velha sem avisar.
   * Nada vai para a IA: e so um download.
   */
  exportDeclaracoes(): void {
    if (!this.projectId || this.isExportingDeclaracoes) return;
    const projectId = this.projectId;
    const salvarAntes = ['pendente', 'salvando', 'erro'].includes(this.estadoSalvamento);

    this.isExportingDeclaracoes = true;
    concat(
      salvarAntes ? this.persistir$().pipe(ignoreElements()) : EMPTY,
      defer(() => this.estadoSalvamento === 'erro'
        ? throwError(() => new Error('salvamento'))
        : this.checklistService.getDeclaracoes(projectId)),
    )
      .pipe(finalize(() => this.zone.run(() => this.isExportingDeclaracoes = false)))
      .subscribe({
        next: (dados) => this.zone.run(() => this.baixarDeclaracoes(dados as DeclaracoesExport)),
        error: (err: any) => this.zone.run(() => {
          console.error('[Declaracoes] Falha ao exportar', err);
          this.feedback = {
            type: 'error',
            message: err?.message === 'salvamento'
              ? 'Não foi possível salvar as últimas alterações, então as declarações não foram exportadas. Tente de novo.'
              : 'Não foi possível exportar as declarações. Tente novamente em instantes.',
          };
        }),
      });
  }

  private baixarDeclaracoes(dados: DeclaracoesExport): void {
    const blob = new Blob([JSON.stringify(dados, null, 2) + '\n'], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = ARQUIVO_DECLARACOES;
    a.click();
    URL.revokeObjectURL(url);

    const marcados = (dados.itens ?? []).filter(i => i.marcado).length;
    this.feedback = {
      type: 'success',
      message: `Declarações exportadas: ${marcados} de ${dados.itens?.length ?? 0} itens marcados. ` +
        `Coloque o ${ARQUIVO_DECLARACOES} na pasta do projeto e peça à lgpd-scan para comparar com o código.`,
    };
  }

  private pararRelogioRelatorio(): void {
    if (this.relogioRelatorio) {
      clearInterval(this.relogioRelatorio);
      this.relogioRelatorio = undefined;
    }
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