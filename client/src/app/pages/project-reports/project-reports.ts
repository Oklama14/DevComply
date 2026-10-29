import { Component, NgZone, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { Project, ProjectsService } from '../../services/projects';
import { ItemHistorico, ReportsService } from '../../services/reports';

type Faixa = 'alta' | 'media' | 'baixa' | 'sem';

/** Um relatorio da lista, com a comparacao com o anterior ja calculada. */
interface LinhaHistorico extends ItemHistorico {
  /** Diferenca de indice para o relatorio anterior, em pontos. */
  variacao: number | null;
  /** Lacunas do anterior que nao aparecem mais neste. */
  resolvidas: string[];
  /** Lacunas que nao estavam no anterior. */
  novas: string[];
  temAnterior: boolean;
}

/** Barra do grafico de evolucao. */
interface BarraEvolucao {
  id: number;
  criadoEm: string;
  pontuacao: number | null;
}

/** Quantos relatorios o grafico mostra (os mais recentes). */
const MAX_BARRAS = 12;

/**
 * Historico de relatorios do projeto: a evolucao do indice, o que foi resolvido de
 * um relatorio para o outro, e o PDF de cada um para baixar de novo sem chamar a IA.
 */
@Component({
  selector: 'app-project-reports',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './project-reports.html',
  styleUrls: ['./project-reports.scss'],
})
export class ProjectReports implements OnInit {
  private platformId = inject(PLATFORM_ID);
  private zone = inject(NgZone);
  private route = inject(ActivatedRoute);
  private projectsService = inject(ProjectsService);
  private reportsService = inject(ReportsService);

  projectId: number | null = null;
  project: Project | null = null;
  linhas: LinhaHistorico[] = [];
  barras: BarraEvolucao[] = [];
  carregando = true;
  erroCarregar: string | null = null;
  mensagem: { tipo: 'sucesso' | 'erro'; texto: string } | null = null;

  baixandoId: number | null = null;
  confirmandoId: number | null = null;
  excluindoId: number | null = null;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.carregando = false;
      return;
    }
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      if (!Number.isInteger(id) || id <= 0) {
        this.carregando = false;
        this.erroCarregar = 'Projeto não encontrado.';
        return;
      }
      this.projectId = id;
      this.carregar();
    });
  }

  carregar(): void {
    if (!this.projectId) return;
    this.carregando = true;
    this.erroCarregar = null;
    forkJoin({
      projeto: this.projectsService.getProject(this.projectId).pipe(catchError(() => of(null))),
      historico: this.reportsService.listarHistorico(this.projectId),
    })
      .pipe(finalize(() => this.zone.run(() => (this.carregando = false))))
      .subscribe({
        next: ({ projeto, historico }) =>
          this.zone.run(() => {
            this.project = projeto;
            this.montar(historico ?? []);
          }),
        error: (err) =>
          this.zone.run(() => {
            console.error('[Relatorios] Falha ao carregar o historico', err);
            this.erroCarregar =
              err?.status === 404
                ? 'Projeto não encontrado.'
                : 'Não foi possível carregar o histórico. Tente novamente.';
          }),
      });
  }

  /** O historico chega do mais recente para o mais antigo. */
  private montar(historico: ItemHistorico[]): void {
    this.linhas = historico.map((item, i) => {
      const anterior = historico[i + 1];
      const pendentes = item.resumo?.pendentes ?? [];
      const pendentesAntes = anterior?.resumo?.pendentes ?? [];
      return {
        ...item,
        temAnterior: !!anterior,
        variacao:
          anterior && item.pontuacao != null && anterior.pontuacao != null
            ? item.pontuacao - anterior.pontuacao
            : null,
        resolvidas: anterior ? pendentesAntes.filter((c) => !pendentes.includes(c)) : [],
        novas: anterior ? pendentes.filter((c) => !pendentesAntes.includes(c)) : [],
      };
    });
    this.barras = historico
      .slice(0, MAX_BARRAS)
      .reverse()
      .map(({ id, criadoEm, pontuacao }) => ({ id, criadoEm, pontuacao }));
  }

  get ultimo(): LinhaHistorico | null {
    return this.linhas[0] ?? null;
  }

  get primeiro(): LinhaHistorico | null {
    return this.linhas.length > 1 ? this.linhas[this.linhas.length - 1] : null;
  }

  /** Mesmas faixas do PDF: 70% ou mais, de 40% a 69%, abaixo de 40%. */
  faixa(pontuacao: number | null): Faixa {
    if (pontuacao == null) return 'sem';
    return pontuacao >= 70 ? 'alta' : pontuacao >= 40 ? 'media' : 'baixa';
  }

  rotuloFaixa(pontuacao: number | null): string {
    return {
      alta: 'Bom nível',
      media: 'Atenção',
      baixa: 'Crítico',
      sem: 'Sem itens avaliados',
    }[this.faixa(pontuacao)];
  }

  baixar(linha: LinhaHistorico): void {
    if (!this.projectId || this.baixandoId) return;
    this.baixandoId = linha.id;
    this.mensagem = null;
    this.reportsService
      .baixarPdf(this.projectId, linha.id)
      .pipe(finalize(() => this.zone.run(() => (this.baixandoId = null))))
      .subscribe({
        next: (pdf) =>
          this.zone.run(() => {
            const url = URL.createObjectURL(pdf);
            const a = document.createElement('a');
            a.href = url;
            a.download = `relatorio-lgpd-${this.projectId}-${this.dataArquivo(linha.criadoEm)}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
          }),
        error: (err) =>
          this.zone.run(() => {
            console.error('[Relatorios] Falha ao baixar', err);
            this.mensagem = { tipo: 'erro', texto: 'Não foi possível baixar o relatório. Tente novamente.' };
          }),
      });
  }

  pedirExclusao(linha: LinhaHistorico): void {
    this.confirmandoId = linha.id;
    this.mensagem = null;
  }

  cancelarExclusao(): void {
    this.confirmandoId = null;
  }

  excluir(linha: LinhaHistorico): void {
    if (!this.projectId || this.excluindoId) return;
    this.excluindoId = linha.id;
    this.reportsService
      .excluir(this.projectId, linha.id)
      .pipe(finalize(() => this.zone.run(() => (this.excluindoId = null))))
      .subscribe({
        next: () =>
          this.zone.run(() => {
            this.confirmandoId = null;
            this.montar(this.linhas.filter((l) => l.id !== linha.id));
            this.mensagem = { tipo: 'sucesso', texto: 'Relatório excluído do histórico.' };
          }),
        error: (err) =>
          this.zone.run(() => {
            console.error('[Relatorios] Falha ao excluir', err);
            this.mensagem = { tipo: 'erro', texto: 'Não foi possível excluir o relatório. Tente novamente.' };
          }),
      });
  }

  /** AAAA-MM-DD-HHmm no horario local, para o nome do arquivo. */
  private dataArquivo(iso: string): string {
    const d = new Date(iso);
    const dois = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}-${dois(d.getHours())}${dois(d.getMinutes())}`;
  }

  trackId(_: number, item: { id: number }): number {
    return item.id;
  }
}
