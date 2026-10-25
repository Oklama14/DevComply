import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type PreferenciaTema = 'claro' | 'escuro' | 'sistema';

const CHAVE = 'devcomply-theme';

/**
 * Tema claro/escuro. O padrao e o CLARO, para todo mundo: o escuro so liga quando o
 * usuario escolhe "Escuro" (ou "Automatico", que segue o sistema) em Configuracoes
 * ou no atalho da barra lateral. Nada fica no localStorage ("devcomply-theme")
 * enquanto o tema for o padrao. O index.html aplica a mesma regra antes do Angular
 * subir, para nao piscar.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly mql = this.browser ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  readonly preferencia = signal<PreferenciaTema>(this.lerPreferencia());
  readonly escuro = signal(false);

  constructor() {
    this.mql?.addEventListener('change', () => this.aplicar());
    this.aplicar();
  }

  definir(preferencia: PreferenciaTema): void {
    this.preferencia.set(preferencia);
    try {
      if (preferencia === 'claro') localStorage.removeItem(CHAVE);
      else localStorage.setItem(CHAVE, preferencia);
    } catch {
      // armazenamento bloqueado: o tema vale so ate recarregar a pagina
    }
    this.aplicar();
  }

  /** Alterna entre claro e escuro (atalho da barra lateral). */
  alternar(): void {
    this.definir(this.escuro() ? 'claro' : 'escuro');
  }

  private lerPreferencia(): PreferenciaTema {
    if (!this.browser) return 'claro';
    try {
      const v = localStorage.getItem(CHAVE);
      return v === 'escuro' || v === 'sistema' ? v : 'claro';
    } catch {
      return 'claro';
    }
  }

  private aplicar(): void {
    if (!this.browser) return;
    const pref = this.preferencia();
    const escuro = pref === 'escuro' || (pref === 'sistema' && !!this.mql?.matches);
    this.escuro.set(escuro);
    const root = document.documentElement;
    root.dataset['theme'] = escuro ? 'dark' : 'light';
    root.style.colorScheme = escuro ? 'dark' : 'light';
  }
}
