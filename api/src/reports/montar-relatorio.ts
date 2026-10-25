import {
  LGPD_CHECK_CATEGORIAS,
  LGPD_CHECK_ITENS,
} from '../checklist/catalog/lgpd-check.catalog';
import { FrontCategory } from '../types/ai.types';
import {
  AvaliacaoIA,
  AvaliacaoItemIA,
  GRAVIDADES,
  Gravidade,
  ItemEntrada,
  ItemRelatorio,
  Relatorio,
  SITUACOES,
  SecaoRelatorio,
} from './relatorio.types';

const ITEM_POR_CODIGO = new Map(LGPD_CHECK_ITENS.map((i) => [i.codigo, i]));

const normalizar = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

const normalizarCodigo = (s: unknown) =>
  String(s ?? '')
    .trim()
    .toUpperCase();

/**
 * Itens como o front manda (todas as perguntas, marcadas ou nao), completados com o
 * catalogo do LGPD-Check: pergunta oficial, artigo e recomendacao.
 * Front antigo mandava so os itens marcados e sem `marcado`: conta como marcado.
 */
export function itensDeEntrada(categorias: FrontCategory[]): ItemEntrada[] {
  return categorias.flatMap((cat) =>
    (cat.items ?? []).map((item, k) => {
      const codigo =
        normalizarCodigo(item.codigo) || `${cat.categoria_nome}-${k + 1}`;
      const catalogo = ITEM_POR_CODIGO.get(codigo);
      return {
        codigo,
        secao: cat.categoria_nome,
        pergunta: catalogo?.pergunta ?? item.titulo_item,
        referencia: catalogo?.referencia ?? item.artigo_referente,
        marcado: item.marcado ?? true,
        implementacao: item.resposta_implementacao ?? '',
        tecnico: item.resposta_tecnica ?? '',
        recomendacaoCatalogo: catalogo?.recomendacao,
      };
    }),
  );
}

/** Lista de frases limpa (a IA as vezes manda vazio ou repetido). */
function frases(valor: unknown, max = 4): string[] {
  if (!Array.isArray(valor)) return [];
  const vistas = new Set<string>();
  const out: string[] = [];
  for (const v of valor) {
    const t = String(v ?? '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!t || vistas.has(t)) continue;
    vistas.add(t);
    out.push(t);
    if (out.length >= max) break;
  }
  return out;
}

function itemAvaliado(
  entrada: ItemEntrada,
  ia: AvaliacaoItemIA | undefined,
): ItemRelatorio {
  const base = {
    codigo: entrada.codigo,
    pergunta: entrada.pergunta,
    referencia: entrada.referencia,
  };

  if (!entrada.marcado) {
    return {
      ...base,
      origem: 'nao_marcado',
      situacao: 'nao_atende',
      pontosFortes: [],
      lacunas: [],
      recomendacoes: [
        entrada.recomendacaoCatalogo ??
          'Implemente o requisito e marque o item no checklist.',
      ],
    };
  }

  if (!ia || !SITUACOES.includes(ia.situacao)) {
    return {
      ...base,
      origem: 'nao_avaliado',
      pontosFortes: [],
      lacunas: [],
      recomendacoes: [],
    };
  }

  // Situacao "atende" nao tem gravidade; parcial/nao atende sem gravidade valida vira "leve".
  const gravidade: Gravidade | undefined =
    ia.situacao === 'atende'
      ? undefined
      : GRAVIDADES.includes(ia.gravidade as Gravidade)
        ? (ia.gravidade as Gravidade)
        : 'leve';

  return {
    ...base,
    origem: 'ia',
    situacao: ia.situacao,
    gravidade,
    pontosFortes: frases(ia.pontos_fortes),
    lacunas:
      ia.situacao === 'atende' ? frases(ia.lacunas, 2) : frases(ia.lacunas),
    recomendacoes: frases(ia.recomendacoes),
  };
}

/** Junta as respostas do checklist com a avaliacao da IA, na ordem do checklist. */
export function montarRelatorio(
  entrada: ItemEntrada[],
  avaliacao: AvaliacaoIA | null,
  opts: { projeto?: string; modelo?: string; geradoEm?: Date } = {},
): Relatorio {
  const porCodigo = new Map<string, AvaliacaoItemIA>();
  for (const it of avaliacao?.itens ?? []) {
    const cod = normalizarCodigo(it?.codigo);
    if (cod && !porCodigo.has(cod)) porCodigo.set(cod, it);
  }

  const resumoPorSecao = new Map<string, string>();
  for (const s of avaliacao?.secoes ?? []) {
    if (s?.secao && s?.resumo)
      resumoPorSecao.set(normalizar(s.secao), String(s.resumo).trim());
  }

  const secoes: SecaoRelatorio[] = [];
  for (const item of entrada) {
    let secao = secoes.find((s) => s.titulo === item.secao);
    if (!secao) {
      const catalogo = LGPD_CHECK_CATEGORIAS.find(
        (c) => normalizar(c.titulo) === normalizar(item.secao),
      );
      secao = {
        titulo: item.secao,
        referencia: catalogo?.artigo,
        resumo: resumoPorSecao.get(normalizar(item.secao)),
        itens: [],
      };
      secoes.push(secao);
    }
    secao.itens.push(itemAvaliado(item, porCodigo.get(item.codigo)));
  }

  return {
    projeto: opts.projeto,
    modelo: opts.modelo,
    geradoEm: opts.geradoEm ?? new Date(),
    resumoExecutivo: avaliacao?.resumo_executivo?.trim() || undefined,
    secoes,
  };
}
