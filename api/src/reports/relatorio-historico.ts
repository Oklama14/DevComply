import { contar, indiceConformidade } from './relatorio-pdf';
import { Relatorio } from './relatorio.types';

/**
 * O que o historico guarda de cada relatorio.
 *
 * - `resumo`: numeros para a lista e para a evolucao do projeto (indice, contagem
 *   por situacao, lacunas por gravidade e os codigos ainda pendentes, para mostrar o
 *   que foi resolvido e o que apareceu de um relatorio para o outro).
 * - `conteudo`: o relatorio inteiro, para montar o PDF de novo sem chamar a IA. As
 *   respostas do checklist nao entram: o relatorio guarda a avaliacao, nao o que o
 *   usuario escreveu.
 */
export interface ResumoRelatorio {
  total: number;
  atende: number;
  parcial: number;
  nao_atende: number;
  nao_avaliado: number;
  /** Itens nao marcados no checklist (entram como "Nao atende", sem IA). */
  nao_marcados: number;
  /** Lacunas (parcial ou nao atende) por gravidade; item nao marcado nao tem gravidade. */
  lacunas: {
    catastrofica: number;
    grave: number;
    leve: number;
    nao_implementado: number;
  };
  /** Codigos com lacuna, na ordem do checklist. */
  pendentes: string[];
}

/** Versao do formato de `conteudo`; mudar o formato pede um numero novo. */
export const VERSAO_CONTEUDO = 1;

export type RelatorioGuardado = Omit<Relatorio, 'geradoEm'> & {
  versao: number;
  geradoEm: string;
};

export function resumirRelatorio(relatorio: Relatorio): {
  pontuacao: number | null;
  resumo: ResumoRelatorio;
} {
  const itens = relatorio.secoes.flatMap((s) => s.itens);
  const c = contar(itens);
  const lacunas = { catastrofica: 0, grave: 0, leve: 0, nao_implementado: 0 };
  const pendentes: string[] = [];

  for (const item of itens) {
    if (item.situacao !== 'parcial' && item.situacao !== 'nao_atende') continue;
    pendentes.push(item.codigo);
    if (item.origem === 'nao_marcado') lacunas.nao_implementado++;
    else lacunas[item.gravidade ?? 'leve']++;
  }

  return {
    pontuacao: indiceConformidade(c),
    resumo: {
      total: c.total,
      atende: c.atende,
      parcial: c.parcial,
      nao_atende: c.nao_atende,
      nao_avaliado: c.nao_avaliado,
      nao_marcados: c.naoMarcados,
      lacunas,
      pendentes,
    },
  };
}

export function guardarRelatorio(relatorio: Relatorio): RelatorioGuardado {
  return { ...relatorio, versao: VERSAO_CONTEUDO, geradoEm: relatorio.geradoEm.toISOString() };
}

export function restaurarRelatorio(guardado: RelatorioGuardado): Relatorio {
  const { versao: _versao, geradoEm, ...resto } = guardado;
  return { ...resto, geradoEm: new Date(geradoEm) };
}
