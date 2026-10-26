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
  let responseRepo: { find: jest.Mock; findOne: jest.Mock; save: jest.Mock; count: jest.Mock };
  const repo = () => ({ find: jest.fn(), findOne: jest.fn(), save: jest.fn(), count: jest.fn() });

  beforeEach(async () => {
    questionRepo = repo();
    responseRepo = repo();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ChecklistService,
        { provide: getRepositoryToken(ChecklistQuestion), useValue: questionRepo },
        { provide: getRepositoryToken(ChecklistResponse), useValue: responseRepo },
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

  describe('exportarDeclaracoes (devcomply/declaracoes/1, lido pela lgpd-scan)', () => {
    const consentimento = { id: 2, titulo: 'Consentimento', descricao: null, artigo: 'Art. 8º' };
    const direitos = { id: 3, titulo: 'Direitos do titular', descricao: null, artigo: 'Art. 18' };

    beforeEach(() => {
      questionRepo.find.mockResolvedValue([
        { id: 10, codigo: 'C-03', pergunta: 'Registro do consentimento?', referencia: null, dica: null, obrigatorio: true, descricao: null, artigo: consentimento },
        { id: 11, codigo: ' d-07 ', pergunta: 'Eliminacao?', referencia: null, dica: null, obrigatorio: true, descricao: null, artigo: direitos },
        { id: 12, codigo: 'D-04', pergunta: 'Correcao?', referencia: null, dica: null, obrigatorio: true, descricao: null, artigo: direitos },
      ]);
      responseRepo.find.mockResolvedValue([
        { perguntaId: 10, conformidade: true, resposta: '  Guardamos o aceite.  ', detalhesTecnicos: 'coluna aceite_em' },
        { perguntaId: 11, conformidade: false, resposta: '', detalhesTecnicos: null },
      ]);
    });

    it('segue o contrato: schema, projeto, data e um item por pergunta, na ordem do checklist', async () => {
      const out = await service.exportarDeclaracoes(7, ' Loja ', new Date('2026-10-25T12:00:00Z'));

      expect(responseRepo.find).toHaveBeenCalledWith(expect.objectContaining({ where: { projetoId: 7 } }));
      expect(out.schema).toBe('devcomply/declaracoes/1');
      expect(out.projeto).toBe('Loja');
      expect(out.gerado_em).toBe('2026-10-25T12:00:00.000Z');
      expect(out.itens.map((i) => i.codigo)).toEqual(['C-03', 'D-07', 'D-04']);
    });

    it('marcado vem da conformidade; item sem resposta salva conta como nao marcado', async () => {
      const { itens } = await service.exportarDeclaracoes(7, 'Loja');

      expect(itens[0]).toEqual({
        codigo: 'C-03',
        secao: 'Consentimento',
        pergunta: 'Registro do consentimento?',
        marcado: true,
        implementacao: 'Guardamos o aceite.',
        tecnico: 'coluna aceite_em',
      });
      // Texto vazio fica de fora em vez de ir como "".
      expect(itens[1]).toEqual({ codigo: 'D-07', secao: 'Direitos do titular', pergunta: 'Eliminacao?', marcado: false });
      expect(itens[2].marcado).toBe(false);
      expect(itens[2].implementacao).toBeUndefined();
    });

    it('projeto sem nome vai como null', async () => {
      const out = await service.exportarDeclaracoes(7, '   ');
      expect(out.projeto).toBeNull();
    });
  });

  it('nao semeia dados durante a requisicao', async () => {
    questionRepo.find.mockResolvedValue([]);
    await service.getStructuredQuestions();
    expect(questionRepo.count).not.toHaveBeenCalled();
    expect(questionRepo.save).not.toHaveBeenCalled();
  });
});
