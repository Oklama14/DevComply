import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ChecklistService } from './checklist.service';
import { ChecklistQuestion } from './entities/checklist-question.entity';
import { ChecklistResponse } from './entities/checklist-response.entity';
import { LgpdArticle } from './entities/lgpd-article.entity';

describe('ChecklistService', () => {
  let service: ChecklistService;
  let questionRepo: { find: jest.Mock; findOne: jest.Mock; save: jest.Mock; count: jest.Mock };
  const repo = () => ({ find: jest.fn(), findOne: jest.fn(), save: jest.fn(), count: jest.fn() });

  beforeEach(async () => {
    questionRepo = repo();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ChecklistService,
        { provide: getRepositoryToken(ChecklistQuestion), useValue: questionRepo },
        { provide: getRepositoryToken(ChecklistResponse), useValue: repo() },
        { provide: getRepositoryToken(LgpdArticle), useValue: repo() },
        { provide: DataSource, useValue: { query: jest.fn() } },
      ],
    }).compile();
    service = moduleRef.get(ChecklistService);
  });

  it('deve ser definido', () => {
    expect(service).toBeDefined();
  });

  it('agrupa as perguntas por secao e expoe codigo, referencia, recomendacao e obrigatoriedade', async () => {
    const transparencia = { id: 1, titulo: 'Transparência de dados', descricao: 'd1', artigo: 'Arts. 6º e 9º' };
    const seguranca = { id: 5, titulo: 'Segurança de dados', descricao: 'd5', artigo: 'Arts. 33 e 46 a 50' };
    questionRepo.find.mockResolvedValue([
      { id: 2, codigo: 'T-03', pergunta: 'P1', referencia: 'Art. 9º, I', dica: 'R1', obrigatorio: true, descricao: null, artigo: transparencia },
      { id: 50, codigo: 'S-17', pergunta: 'P2', referencia: null, dica: 'R2', obrigatorio: false, descricao: null, artigo: seguranca },
    ]);

    const result = await service.getStructuredQuestions();

    expect(result.map((c) => c.nome)).toEqual(['Transparência de dados', 'Segurança de dados']);
    expect(result[0].items[0]).toMatchObject({
      id: 2,
      codigo: 'T-03',
      titulo: 'P1',
      lgpdReference: 'Art. 9º, I',
      tipText: 'R1',
      obrigatorio: true,
    });
    // Sem referencia propria, cai para o artigo da secao.
    expect(result[1].items[0]).toMatchObject({ codigo: 'S-17', lgpdReference: 'Arts. 33 e 46 a 50', obrigatorio: false });
  });

  it('nao semeia dados durante a requisicao', async () => {
    questionRepo.find.mockResolvedValue([]);
    await service.getStructuredQuestions();
    expect(questionRepo.count).not.toHaveBeenCalled();
    expect(questionRepo.save).not.toHaveBeenCalled();
  });
});
