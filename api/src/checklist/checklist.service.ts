import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChecklistQuestion } from './entities/checklist-question.entity';
import { ChecklistResponse } from './entities/checklist-response.entity';
import { LgpdArticle } from './entities/lgpd-article.entity';
import { SaveChecklistDto } from './dto/save-checklist.dto';
import { ChecklistCategoryDto, ChecklistItemDto } from './dto/checklist.dto';

@Injectable()
export class ChecklistService {
  constructor(
  @InjectRepository(ChecklistResponse) private readonly responseRepo: Repository<ChecklistResponse>,
  @InjectRepository(ChecklistQuestion) private readonly questionRepo: Repository<ChecklistQuestion>,
  @InjectRepository(LgpdArticle)      private readonly articleRepo: Repository<LgpdArticle>,
) {}

  /** Estrutura agrupada por artigo (categoria) que o front consome */
  async getStructuredQuestions(): Promise<ChecklistCategoryDto[]> {
    const rows = await this.questionRepo.find({
      relations: ['artigo'],
      order: { artigo: { id: 'ASC' }, id: 'ASC' },
    });

    const map = new Map<number, ChecklistCategoryDto>();

    for (const q of rows) {
      const artigo = q.artigo; // LgpdArticle
      const catId = artigo?.id ?? 0;

      if (!map.has(catId)) {
        map.set(catId, {
          id: catId,
          nome: artigo?.titulo ?? 'Geral',
          descricao: artigo?.descricao ?? undefined,
          items: [],
        });
      }

      const item: ChecklistItemDto = {
        id: q.id,
        titulo: q.pergunta,
        descricao: undefined, // adicione coluna em checklist_perguntas se quiser
        lgpdReference: artigo?.artigo || q.codigo, // badge: "Art. X" com fallback no código
        tipText: undefined, // adicione coluna 'dica' em checklist_perguntas, se desejar
      };

      map.get(catId)!.items.push(item);
    }

    return Array.from(map.values());
  }

  /** Compatibilidade com seu controller atual: vamos fazer getQuestions() delegar ao formato estruturado */
  async getQuestions(): Promise<ChecklistCategoryDto[]> {
    return this.getStructuredQuestions();
  }

  /** GET /checklist/project/:id — respostas por projeto */
  async findByProjectId(projectId: number): Promise<ChecklistResponse[]> {
    return this.responseRepo.find({
      where: { projetoId: projectId }, // ajuste para 'projectId' se sua entity usar inglês
      order: { id: 'ASC' },
    });
  }

  /** POST /checklist/project/:id — salvar (upsert por pergunta) */
  async saveChecklistResponses(
  projectId: number,
  dtos: SaveChecklistDto[],
): Promise<ChecklistResponse[]> {
  if (!Array.isArray(dtos) || dtos.length === 0) {
    return [];
  }

  const existing = await this.responseRepo.find({
    where: { projetoId: projectId },  
  });

  const byPergunta = new Map<number, ChecklistResponse>(
    existing.map(r => [r.perguntaId, r]),
  );

  const toSave: ChecklistResponse[] = [];

  for (const dto of dtos) {
    let current: ChecklistResponse | undefined = byPergunta.get(dto.perguntaId);

    if (!current) {
      current = this.responseRepo.create({
        projetoId: projectId,           
        perguntaId: dto.perguntaId,
      } as Partial<ChecklistResponse>);
    }

    current.resposta = dto.resposta ?? null;
    current.detalhesTecnicos = dto.detalhesTecnicos ?? null;
    current.conformidade = !!dto.conformidade;

    toSave.push(current);
  }

  return this.responseRepo.save(toSave);
}
}
