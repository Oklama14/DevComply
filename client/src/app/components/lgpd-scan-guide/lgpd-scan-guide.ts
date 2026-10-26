import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  NgZone,
  OnDestroy,
  Output,
  PLATFORM_ID,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

export type SistemaGuia = 'windows' | 'unix';

/** Resultado da ultima exportacao, mostrado no passo 2. */
export interface ResultadoExportacao {
  marcados: number;
  total: number;
}

/** Endereco publico da skill. */
export const LGPD_SCAN_REPO = 'https://github.com/Oklama14/lgpd-scan';
/** Nome que o comando da skill espera (`--declaracoes devcomply-declaracoes.json`). */
export const ARQUIVO_DECLARACOES = 'devcomply-declaracoes.json';

/**
 * Passo a passo para levar as declaracoes do checklist ate a lgpd-scan: instalar a
 * skill, baixar o arquivo e pedir ao agente. O download fica dentro do guia de
 * proposito -- o arquivo sozinho nao diz o que fazer com ele.
 */
@Component({
  selector: 'app-lgpd-scan-guide',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lgpd-scan-guide.html',
  styleUrls: ['./lgpd-scan-guide.scss'],
})
export class LgpdScanGuide implements AfterViewInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private zone = inject(NgZone);

  @Input() exportando = false;
  @Input() resultado: ResultadoExportacao | null = null;
  @Input() erro: string | null = null;

  @Output() fechar = new EventEmitter<void>();
  @Output() baixar = new EventEmitter<void>();

  @ViewChild('titulo') titulo?: ElementRef<HTMLElement>;

  readonly repo = LGPD_SCAN_REPO;
  readonly arquivo = ARQUIVO_DECLARACOES;

  readonly instalar: Record<SistemaGuia, string> = {
    windows:
      `git clone ${LGPD_SCAN_REPO}.git "$HOME\\lgpd-scan"\n` +
      'powershell -ep Bypass -File "$HOME\\lgpd-scan\\install.ps1" -Scope user',
    unix:
      `git clone ${LGPD_SCAN_REPO}.git ~/lgpd-scan\n` +
      'sh ~/lgpd-scan/install.sh --scope user',
  };

  readonly atualizar: Record<SistemaGuia, string> = {
    windows:
      'git -C "$HOME\\lgpd-scan" pull\n' +
      'powershell -ep Bypass -File "$HOME\\lgpd-scan\\install.ps1" -Scope user',
    unix: 'git -C ~/lgpd-scan pull && sh ~/lgpd-scan/install.sh --scope user',
  };

  readonly pedido =
    `Audite este projeto com a lgpd-scan e compare com o que declaramos no DevComply ` +
    `(arquivo ${ARQUIVO_DECLARACOES}).`;

  sistema: SistemaGuia = 'unix';
  /** Qual bloco acabou de ser copiado (some depois de 2 s). */
  copiado: string | null = null;
  private timerCopiado?: ReturnType<typeof setTimeout>;
  private focoAnterior: HTMLElement | null = null;

  constructor() {
    if (isPlatformBrowser(this.platformId) && /windows/i.test(navigator.userAgent)) {
      this.sistema = 'windows';
    }
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    // Leitor de tela e teclado comecam no guia, e voltam ao botao que o abriu.
    this.focoAnterior = document.activeElement as HTMLElement | null;
    setTimeout(() => this.titulo?.nativeElement.focus());
  }

  ngOnDestroy(): void {
    if (this.timerCopiado) clearTimeout(this.timerCopiado);
    this.focoAnterior?.focus?.();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.fechar.emit();
  }

  async copiar(chave: string, texto: string): Promise<void> {
    let ok = false;
    try {
      await navigator.clipboard.writeText(texto);
      ok = true;
    } catch {
      // Sem permissao de area de transferencia (http, navegador antigo): o texto
      // continua selecionavel no bloco.
    }
    // A Promise do clipboard resolve fora da zona do Angular.
    this.zone.run(() => {
      this.copiado = ok ? chave : null;
      if (this.timerCopiado) clearTimeout(this.timerCopiado);
      this.timerCopiado = setTimeout(() => this.zone.run(() => (this.copiado = null)), 2000);
    });
  }
}
