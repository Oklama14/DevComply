export enum Conformidade {
  LOW = 'Incompleto',
  MEDIUM = 'Básico',
  HIGH = 'Adequado',
  VERY_HIGH = 'Avançado',
}

// Resposta que a IA vai gerar
export interface Resposta {
  titulo: string;
  resumo: string;
  em_conformidade: Conformidade;
}

// DTO para pedir à IA um relatório de uma categoria
export interface GerarRelatorioDto {
  instrucao?: string;                  // opcional
  categoria: string;                   // ex.: "Princípios de Transparência"
  resposta_implementacao: string;      // texto livre do usuário
  resposta_tecnica: string;            // texto livre do usuário
  artigo_referente?: string;           // opcional: LGPD Artigo
}

// Estrutura vinda do front
export interface FrontCategory {
  categoria_nome: string;
  items: FrontItem[];
}

// Estrutura de cada item vindo do front
export interface FrontItem {
  titulo_item: string;
  resposta_implementacao?: string;
  resposta_tecnica?: string;
  artigo_referente?: string;
}
