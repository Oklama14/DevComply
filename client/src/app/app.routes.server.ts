import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Paginas publicas saem prontas do build (pre-renderizadas): o HTML ja traz o texto.
 * Os robos de busca das IAs (ChatGPT, Claude, Perplexity) nao executam JavaScript, e
 * antes recebiam so um <app-root> vazio. A area logada continua renderizada no
 * navegador: nao tem o que indexar e depende do token do usuario.
 */
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'politica-privacidade', renderMode: RenderMode.Prerender },
  { path: 'termos-uso', renderMode: RenderMode.Prerender },
  { path: '**', renderMode: RenderMode.Client },
];
