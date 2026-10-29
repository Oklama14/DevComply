import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Report } from './entities/report.entity';
import { ReportHistoryService } from './report-history.service';
import { Relatorio } from './relatorio.types';

describe('ReportHistoryService', () => {
  let service: ReportHistoryService;
  const repo = {
    create: jest.fn((x) => x),
    save: jest.fn(async (x) => ({ id: 3, ...x })),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };

  const relatorio: Relatorio = {
    projeto: 'Loja',
    modelo: 'gemini-x',
    geradoEm: new Date('2026-10-29T15:00:00.000Z'),
    secoes: [
      {
        titulo: 'Consentimento',
        itens: [
          {
            codigo: 'C-03',
            pergunta: 'P',
            origem: 'ia',
            situacao: 'nao_atende',
            gravidade: 'grave',
            pontosFortes: [],
            lacunas: ['Sem registro'],
            recomendacoes: ['Registre o aceite'],
            evidencias: [],
          },
        ],
      },
    ],
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [ReportHistoryService, { provide: getRepositoryToken(Report), useValue: repo }],
    }).compile();
    service = moduleRef.get(ReportHistoryService);
  });

  it('salva resumo, indice, modelo e o conteudo completo', async () => {
    await service.salvar(7, relatorio);
    const gravado = repo.save.mock.calls[0][0];
    expect(gravado).toMatchObject({
      projetoId: 7,
      status: 'gerado',
      pontuacao: 0,
      modelo: 'gemini-x',
      resumo: { total: 1, nao_atende: 1, pendentes: ['C-03'] },
    });
    expect(gravado.conteudo).toMatchObject({ versao: 1, geradoEm: '2026-10-29T15:00:00.000Z' });
  });

  it('lista so o projeto pedido, do mais recente para o mais antigo, sem o conteudo', async () => {
    repo.find.mockResolvedValue([
      { id: 4, criadoEm: new Date(), modelo: 'm', pontuacao: 50, resumo: { total: 2 }, status: 'gerado', projetoId: 7 },
    ]);
    const lista = await service.listar(7);
    expect(repo.find).toHaveBeenCalledWith({ where: { projetoId: 7 }, order: { criadoEm: 'DESC', id: 'DESC' } });
    expect(lista).toEqual([
      { id: 4, criadoEm: expect.any(Date), modelo: 'm', pontuacao: 50, resumo: { total: 2 } },
    ]);
    expect(lista[0]).not.toHaveProperty('conteudo');
  });

  it('busca pelo id E pelo projeto: o id de outro projeto nao alcanca nada', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.buscar(7, 99)).rejects.toThrow(NotFoundException);
    expect(repo.findOne).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 99, projetoId: 7 } }));
  });

  it('busca devolve o relatorio com a data restaurada', async () => {
    repo.findOne.mockResolvedValue({
      id: 3,
      conteudo: JSON.parse(JSON.stringify({ ...relatorio, versao: 1, geradoEm: relatorio.geradoEm.toISOString() })),
    });
    const r = await service.buscar(7, 3);
    expect(r.geradoEm).toEqual(relatorio.geradoEm);
    expect(r.secoes[0].itens[0].codigo).toBe('C-03');
  });

  it('remover de outro projeto: 404', async () => {
    repo.delete.mockResolvedValue({ affected: 0 });
    await expect(service.remover(7, 99)).rejects.toThrow(NotFoundException);
    expect(repo.delete).toHaveBeenCalledWith({ id: 99, projetoId: 7 });
  });
});
