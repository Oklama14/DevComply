
// Formato que o front espera em GET /checklist/questions
export class ChecklistItemDto {
  id: number;
  codigo?: string;        // Ex.: "S-17" (codigo do item no LGPD-Check)
  titulo: string;
  descricao?: string;
  lgpdReference?: string; // Ex.: "Art. 18, V"
  tipText?: string;       // Recomendacao do LGPD-Check
  obrigatorio?: boolean;  // false = item opcional (boa pratica)
}

export class ChecklistCategoryDto {
  id: number;          // id do artigo (categoria)
  nome: string;        // titulo do artigo
  descricao?: string;  // descricao do artigo
  items: ChecklistItemDto[];
}
