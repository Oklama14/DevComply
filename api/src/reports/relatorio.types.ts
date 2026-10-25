/**
 * Tipos do relatorio de conformidade.
 *
 * Escala do LGPD-Check (Mendes, Viana e Rivero, SBES 2021; Neitzke et al., SBQS 2023):
 * cada item atende, atende parcialmente ou nao atende; o que nao atende (total ou
 * parcialmente) recebe uma gravidade. Os criterios de cada nivel estao no prompt
 * (CRITERIOS_AVALIACAO) e na legenda do PDF, com o mesmo texto.
 */

export type Situacao = 'atende' | 'parcial' | 'nao_atende';
export type Gravidade = 'leve' | 'grave' | 'catastrofica';

export const SITUACOES: Situacao[] = ['atende', 'parcial', 'nao_atende'];
export const GRAVIDADES: Gravidade[] = ['leve', 'grave', 'catastrofica'];

/** Item do checklist como chega para o relatorio (front + catalogo). */
export interface ItemEntrada {
  codigo: string;
  secao: string;
  pergunta: string;
  referencia?: string;
  /** Marcado no checklist = o usuario declara que implementou. */
  marcado: boolean;
  implementacao: string;
  tecnico: string;
  /** Recomendacao do LGPD-Check para o item (catalogo). */
  recomendacaoCatalogo?: string;
}

/** O que a IA devolve para cada item marcado. */
export interface AvaliacaoItemIA {
  codigo: string;
  situacao: Situacao;
  gravidade: Gravidade | 'nenhuma';
  pontos_fortes: string[];
  lacunas: string[];
  recomendacoes: string[];
}

/** Resposta completa da IA (uma chamada por relatorio). */
export interface AvaliacaoIA {
  resumo_executivo: string;
  secoes: Array<{ secao: string; resumo: string }>;
  itens: AvaliacaoItemIA[];
}

/**
 * De onde veio a situacao do item no relatorio:
 * - ia: item marcado, avaliado pela IA;
 * - nao_marcado: item nao marcado no checklist (entra como "Nao atende", sem IA);
 * - nao_avaliado: item marcado que a IA nao devolveu.
 */
export type OrigemItem = 'ia' | 'nao_marcado' | 'nao_avaliado';

export interface ItemRelatorio {
  codigo: string;
  pergunta: string;
  referencia?: string;
  origem: OrigemItem;
  /** Ausente quando origem = 'nao_avaliado'. */
  situacao?: Situacao;
  gravidade?: Gravidade;
  pontosFortes: string[];
  lacunas: string[];
  recomendacoes: string[];
}

export interface SecaoRelatorio {
  titulo: string;
  referencia?: string;
  resumo?: string;
  itens: ItemRelatorio[];
}

export interface Relatorio {
  projeto?: string;
  geradoEm: Date;
  /** Modelo do Gemini que fez a avaliacao. */
  modelo?: string;
  resumoExecutivo?: string;
  secoes: SecaoRelatorio[];
}
