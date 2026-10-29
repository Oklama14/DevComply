import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { environment } from '../../environments/environment';

/**
 * O que cada rota diz aos buscadores (Google, Bing) e as buscas das IAs (ChatGPT,
 * Gemini, Perplexity). Fica em `data.seo` da rota.
 *
 * - `titulo` e `descricao` precisam bater com o texto visivel da pagina: e o que o
 *   buscador mostra, e o que a IA usa para decidir se a pagina responde a pergunta.
 * - `indexar: true` so nas paginas publicas pre-renderizadas (app.routes.server.ts).
 *   O resto (login, area logada) sai com noindex, que tambem e o padrao do
 *   index.html: a casca que a Vercel devolve para rotas do app ja nasce noindex.
 */
export interface SeoRota {
  titulo: string;
  descricao?: string;
  indexar?: boolean;
  /** Dados estruturados (schema.org) da pagina, em JSON-LD. */
  jsonLd?: Record<string, unknown>;
}

const NOME_SITE = 'DevComply';
const ID_JSON_LD = 'dados-estruturados';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly doc = inject(DOCUMENT);

  iniciar(): void {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.aplicar(this.dadosDaRota(), e.urlAfterRedirects));
  }

  /** A rota mais funda com `data.seo` (as filhas da area logada herdam do layout). */
  private dadosDaRota(): SeoRota | undefined {
    let atual: ActivatedRoute | null = this.route;
    let seo: SeoRota | undefined;
    while (atual) {
      seo = (atual.snapshot.data?.['seo'] as SeoRota | undefined) ?? seo;
      atual = atual.firstChild;
    }
    return seo;
  }

  aplicar(seo: SeoRota | undefined, url: string): void {
    const titulo = seo?.titulo ?? NOME_SITE;
    const indexar = !!seo?.indexar;
    const caminho = url.split(/[?#]/)[0] || '/';
    const endereco = environment.siteUrl + (caminho === '/' ? '/' : caminho);

    this.title.setTitle(titulo);
    this.meta.updateTag({ name: 'robots', content: indexar ? 'index, follow' : 'noindex' });

    if (seo?.descricao) {
      this.meta.updateTag({ name: 'description', content: seo.descricao });
    } else {
      this.meta.removeTag('name="description"');
    }

    // Compartilhamento (WhatsApp, LinkedIn, Slack) e alguns buscadores leem estas.
    if (indexar) {
      this.meta.updateTag({ property: 'og:type', content: 'website' });
      this.meta.updateTag({ property: 'og:site_name', content: NOME_SITE });
      this.meta.updateTag({ property: 'og:locale', content: 'pt_BR' });
      this.meta.updateTag({ property: 'og:title', content: titulo });
      this.meta.updateTag({ property: 'og:url', content: endereco });
      this.meta.updateTag({ name: 'twitter:card', content: 'summary' });
      if (seo?.descricao) this.meta.updateTag({ property: 'og:description', content: seo.descricao });
    } else {
      for (const p of ['og:type', 'og:site_name', 'og:locale', 'og:title', 'og:url', 'og:description']) {
        this.meta.removeTag(`property="${p}"`);
      }
      this.meta.removeTag('name="twitter:card"');
    }

    this.definirCanonical(indexar ? endereco : null);
    this.definirJsonLd(indexar ? seo?.jsonLd : undefined);
  }

  private definirCanonical(href: string | null): void {
    let link = this.doc.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!href) {
      link?.remove();
      return;
    }
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', href);
  }

  private definirJsonLd(dados: Record<string, unknown> | undefined): void {
    let script = this.doc.getElementById(ID_JSON_LD);
    if (!dados) {
      script?.remove();
      return;
    }
    if (!script) {
      script = this.doc.createElement('script');
      script.id = ID_JSON_LD;
      script.setAttribute('type', 'application/ld+json');
      this.doc.head.appendChild(script);
    }
    // "<" escapado: o JSON vai dentro de <script> e nao pode fechar a tag.
    script.textContent = JSON.stringify(dados).replace(/</g, '\\u003c');
  }
}
