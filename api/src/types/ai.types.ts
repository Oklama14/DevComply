// Estrutura que o front manda para gerar o relatorio: todas as secoes do checklist
// com todas as perguntas, marcadas ou nao.
export interface FrontCategory {
  categoria_nome: string;
  items: FrontItem[];
}

export interface FrontItem {
  codigo?: string; // ex.: "S-17" (LGPD-Check)
  titulo_item: string;
  resposta_implementacao?: string;
  resposta_tecnica?: string;
  artigo_referente?: string;
  /** Marcado no checklist (o usuario declara que implementou). Ausente = marcado (front antigo). */
  marcado?: boolean;
}
