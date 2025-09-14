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
    @InjectRepository(ChecklistQuestion)
    private readonly questionRepo: Repository<ChecklistQuestion>,

    @InjectRepository(ChecklistResponse)
    private readonly responseRepo: Repository<ChecklistResponse>,

    @InjectRepository(LgpdArticle)
    private readonly articleRepo: Repository<LgpdArticle>,
  ) {}

  /** SEED DEV — cria 1 artigo e 3 perguntas se estiver vazio */
  private async ensureSeed(): Promise<void> {
    const count = await this.questionRepo.count();
    if (count > 0) return;

    // Artigo (categoria)
    const artigo = this.articleRepo.create({
      artigo: 'Art. 6º',
      titulo: 'Princípios de Transparência',
      descricao: 'Avaliação da transparência e informação aos titulares de dados',
    });
    await this.articleRepo.save(artigo);

    // Perguntas
    const perguntas = [
      { codigo: 'T-01', pergunta: 'O sistema possui uma política de privacidade clara e acessível?', artigoId: artigo.id },
      { codigo: 'T-02', pergunta: 'Os usuários são informados sobre a finalidade específica da coleta de dados?', artigoId: artigo.id },
      { codigo: 'T-03', pergunta: 'Existe um mecanismo para obter e registrar o consentimento dos usuários?', artigoId: artigo.id },
    ];
    await this.questionRepo.save(perguntas.map(p => this.questionRepo.create(p)));
  }

  /** Estrutura agrupada por artigo (o front consome isso) */
  async getStructuredQuestions(): Promise<ChecklistCategoryDto[]> {
    await this.ensureSeed(); // <-- garante dados no dev

    const rows = await this.questionRepo.find({
      relations: ['artigo'],
      order: { artigo: { id: 'ASC' }, id: 'ASC' },
    });

    const map = new Map<number, ChecklistCategoryDto>();

    for (const q of rows) {
      const a = q.artigo;
      const catId = a?.id ?? 0;

      if (!map.has(catId)) {
        map.set(catId, {
          id: catId,
          nome: a?.titulo ?? 'Geral',
          descricao: a?.descricao ?? undefined,
          items: [],
        });
      }
const lgpdRef = a?.artigo ?? q.codigo; // pode ficar undefined se ambos faltarem

      const item: ChecklistItemDto = {
        id: q.id,
        titulo: q.pergunta,
        descricao: undefined,                          // adicione coluna se quiser
        lgpdReference: lgpdRef, // badge "Art. 6º"
        tipText: undefined,                            // adicione coluna 'dica' se quiser
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
