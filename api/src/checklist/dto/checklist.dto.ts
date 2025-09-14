// Formato que o front espera em GET /checklist/questions
export class ChecklistItemDto {
  id: number;
  titulo: string;
  descricao?: string;
  lgpdReference?: string; // Ex.: "Art. 6º"
  tipText?: string;
}

export class ChecklistCategoryDto {
  id: number;          // id do artigo (categoria)
  nome: string;        // titulo do artigo
  descricao?: string;  // descricao do artigo
  items: ChecklistItemDto[];
}
