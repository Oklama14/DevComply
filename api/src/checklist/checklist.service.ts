import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { ChecklistQuestion } from './entities/checklist-question.entity';
import { ChecklistResponse } from './entities/checklist-response.entity';
import { LgpdArticle } from './entities/lgpd-article.entity';

import { SaveChecklistDto } from './dto/save-checklist.dto';
import { ChecklistCategoryDto, ChecklistItemDto } from './dto/checklist.dto';
import {
  DECLARACOES_SCHEMA,
  DeclaracaoItem,
  DeclaracoesExport,
} from './dto/declaracoes.dto';
import { aplicarCatalogoLgpdCheck } from './catalog/lgpd-check.catalog';

@Injectable()
export class ChecklistService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ChecklistService.name);

  constructor(
    @InjectRepository(ChecklistQuestion)
    private readonly questionRepo: Repository<ChecklistQuestion>,

    @InjectRepository(ChecklistResponse)
    private readonly responseRepo: Repository<ChecklistResponse>,

    @InjectRepository(LgpdArticle)
    private readonly articleRepo: Repository<LgpdArticle>,

    private readonly dataSource: DataSource,
  ) {}

  /**
   * Em desenvolvimento (synchronize, sem migrations) aplica o catalogo do LGPD-Check
   * no boot. Em producao o catalogo vem da migration LgpdCheckCatalog — nada e
   * semeado durante requisicoes.
   */
  async onApplicationBootstrap(): Promise<void> {
    if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test') return;
    try {
      await aplicarCatalogoLgpdCheck((sql, params) => this.dataSource.query(sql, params));
    } catch (err) {
      this.logger.warn(`Nao foi possivel aplicar o catalogo do checklist: ${String(err)}`);
    }
  }

  /** Estrutura agrupada por secao (o front consome isso) */
  async getStructuredQuestions(): Promise<ChecklistCategoryDto[]> {
    const rows = await this.questionRepo.find({
      relations: ['artigo'],
      order: { artigo: { ordem: 'ASC', id: 'ASC' }, ordem: 'ASC', id: 'ASC' },
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

      const item: ChecklistItemDto = {
        id: q.id,
        codigo: q.codigo ?? undefined,
        titulo: q.pergunta,
        descricao: q.descricao ?? undefined,
        lgpdReference: q.referencia ?? a?.artigo ?? undefined, // badge "Art. 18, V"
        tipText: q.dica ?? undefined, // recomendacao do LGPD-Check
        obrigatorio: q.obrigatorio ?? true,
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

  /**
   * GET /checklist/project/:id/declaracoes — o checklist do projeto no formato
   * `devcomply/declaracoes/1`, para a lgpd-scan confrontar com o codigo.
   *
   * Vao todos os itens, na ordem do checklist: o nao marcado tambem e uma
   * declaracao ("nao implementamos"), e a skill o usa para achar o que esta
   * implementado sem ter sido declarado. Item sem resposta salva conta como nao
   * marcado, como no relatorio.
   */
  async exportarDeclaracoes(
    projectId: number,
    projeto: string | null,
    agora: Date = new Date(),
  ): Promise<DeclaracoesExport> {
    const [estrutura, respostas] = await Promise.all([
      this.getStructuredQuestions(),
      this.findByProjectId(projectId),
    ]);
    const porPergunta = new Map(respostas.map((r) => [r.perguntaId, r]));

    const itens: DeclaracaoItem[] = [];
    for (const secao of estrutura) {
      for (const pergunta of secao.items) {
        const codigo = (pergunta.codigo ?? '').trim().toUpperCase();
        if (!codigo) continue; // sem codigo a skill nao tem como ligar ao requisito
        const resposta = porPergunta.get(pergunta.id);
        const item: DeclaracaoItem = {
          codigo,
          secao: secao.nome,
          pergunta: pergunta.titulo,
          marcado: !!resposta?.conformidade,
        };
        const implementacao = resposta?.resposta?.trim();
        if (implementacao) item.implementacao = implementacao;
        const tecnico = resposta?.detalhesTecnicos?.trim();
        if (tecnico) item.tecnico = tecnico;
        itens.push(item);
      }
    }

    return {
      schema: DECLARACOES_SCHEMA,
      projeto: projeto?.trim() || null,
      gerado_em: agora.toISOString(),
      aviso:
        'O que a equipe marcou e descreveu no checklist do DevComply. Declaracao nao ' +
        'e evidencia: a lgpd-scan confronta cada item com o codigo ' +
        '(python3 scripts/devcomply.py conciliar . --declaracoes devcomply-declaracoes.json).',
      itens,
    };
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
