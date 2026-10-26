/**
 * Declaracoes do checklist no formato que a lgpd-scan le (`devcomply.py conciliar`).
 *
 * O DevComply registra o que a equipe DECLARA; a lgpd-scan le o que o CODIGO faz. Este
 * arquivo e a ponte de ida: a skill confronta cada item marcado com o codigo e aponta
 * o que foi declarado e nao esta implementado. O nome do schema e o contrato entre os
 * dois projetos -- mudar o formato pede um `/2`, nunca uma alteracao silenciosa.
 */
export const DECLARACOES_SCHEMA = 'devcomply/declaracoes/1';

export interface DeclaracaoItem {
  /** Codigo do item no LGPD-Check (ex.: "C-03"). E a chave que a skill usa. */
  codigo: string;
  secao: string;
  pergunta: string;
  /** Item marcado como implementado no checklist. */
  marcado: boolean;
  /** "Explicacao da sua implementacao", quando preenchida. */
  implementacao?: string;
  /** "Detalhes tecnicos", quando preenchidos. */
  tecnico?: string;
}

export interface DeclaracoesExport {
  schema: typeof DECLARACOES_SCHEMA;
  projeto: string | null;
  gerado_em: string;
  aviso: string;
  itens: DeclaracaoItem[];
}
