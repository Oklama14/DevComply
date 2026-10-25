import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { AiService, IaIndisponivelError } from '@/services/ai.service';
import { ProjectsService } from '@/projects/projects.service';
import { UsersService } from '@/users/users.service';
import { ConfigService } from '@nestjs/config';
import { ReportQuotaService } from './report-rate-limit.guard';
import * as pdf from './relatorio-pdf';

describe('ReportsController', () => {
  let controller: ReportsController;
  const ai = { avaliarChecklist: jest.fn() };
  const users = { getGeminiKey: jest.fn() };
  const projects = { findOne: jest.fn() };
  const quota = {
    consumir: jest.fn(() => ({ ok: true })),
    estornar: jest.fn(),
    limite: 10,
  };
  let gerarPdf: jest.SpyInstance;

  const req = { user: { userId: 7 } };
  const res = () => ({ setHeader: jest.fn(), send: jest.fn((b) => b) });
  const arquivo = (payload: unknown) => ({
    buffer: Buffer.from(JSON.stringify(payload)),
  });
  const payload = [
    {
      categoria_nome: 'Segurança de dados',
      items: [
        {
          codigo: 'S-01',
          titulo_item: 'Seguro?',
          resposta_implementacao: 'Login + RBAC',
          marcado: true,
        },
        {
          codigo: 'S-05',
          titulo_item: 'Sensíveis?',
          resposta_implementacao: 'nada',
          marcado: false,
        },
      ],
    },
    {
      categoria_nome: 'Direitos dos usuários',
      items: [
        {
          codigo: 'D-07',
          titulo_item: 'Eliminação?',
          resposta_implementacao: 'Botão excluir',
          marcado: true,
        },
      ],
    },
  ];
  const avaliacaoOk = {
    resumo_executivo: 'Bom nível.',
    secoes: [{ secao: 'Segurança de dados', resumo: 'Ok.' }],
    itens: [
      {
        codigo: 'S-01',
        situacao: 'atende',
        gravidade: 'nenhuma',
        pontos_fortes: ['RBAC'],
        lacunas: [],
        recomendacoes: [],
      },
      {
        codigo: 'D-07',
        situacao: 'parcial',
        gravidade: 'grave',
        pontos_fortes: [],
        lacunas: ['Backups'],
        recomendacoes: ['Defina prazo'],
      },
    ],
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    users.getGeminiKey.mockResolvedValue(null);
    projects.findOne.mockResolvedValue({ id: 1 });
    gerarPdf = jest
      .spyOn(pdf, 'gerarRelatorioPdf')
      .mockResolvedValue(Buffer.from('%PDF'));

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        { provide: AiService, useValue: ai },
        { provide: ProjectsService, useValue: projects },
        { provide: UsersService, useValue: users },
        { provide: ConfigService, useValue: { get: () => undefined } },
        { provide: ReportQuotaService, useValue: quota },
      ],
    }).compile();
    controller = moduleRef.get(ReportsController);
  });

  afterEach(() => gerarPdf.mockRestore());

  it('deve ser definido', () => {
    expect(controller).toBeDefined();
  });

  it('manda so os marcados para a IA, numa chamada, e os nao marcados entram como lacuna', async () => {
    ai.avaliarChecklist.mockResolvedValue({
      avaliacao: avaliacaoOk,
      modelo: 'gemini-x',
    });
    const r = res();

    await controller.uploadChecklist(
      req,
      arquivo(payload),
      { projectId: '1', projectName: 'Avaliação 漢字' },
      r as any,
    );

    expect(ai.avaliarChecklist).toHaveBeenCalledTimes(1);
    const [marcados, naoMarcados, , projeto] =
      ai.avaliarChecklist.mock.calls[0];
    expect(marcados.map((i: any) => i.codigo)).toEqual(['S-01', 'D-07']);
    expect(naoMarcados.map((i: any) => i.codigo)).toEqual(['S-05']);
    expect(projeto).toBe('Avaliação 漢字');

    const relatorio = gerarPdf.mock.calls[0][0];
    expect(relatorio.modelo).toBe('gemini-x');
    const s05 = relatorio.secoes[0].itens.find((i: any) => i.codigo === 'S-05');
    expect(s05).toMatchObject({
      origem: 'nao_marcado',
      situacao: 'nao_atende',
    });
    expect(s05.recomendacoes[0]).toMatch(/\w/); // recomendacao do catalogo

    const disposition = r.setHeader.mock.calls.find(
      ([h]) => h === 'Content-Disposition',
    )[1];
    expect(disposition).toBe(
      'attachment; filename="relatorio-lgpd-1-Avaliacao_.pdf"',
    );
  });

  it('pede para marcar algum item quando nada foi marcado (sem chamar a IA)', async () => {
    const nada = [
      {
        categoria_nome: 'X',
        items: [{ codigo: 'S-01', titulo_item: 'a', marcado: false }],
      },
    ];
    await expect(
      controller.uploadChecklist(req, arquivo(nada), {}, res() as any),
    ).rejects.toThrow(BadRequestException);
    expect(ai.avaliarChecklist).not.toHaveBeenCalled();
  });

  it('responde 503 com o motivo e nao conta no limite quando a IA falha', async () => {
    ai.avaliarChecklist.mockRejectedValue(
      new IaIndisponivelError(
        'Nenhuma chave do Gemini configurada. Cadastre sua chave em Configurações.',
        'sem-chave',
      ),
    );

    await expect(
      controller.uploadChecklist(
        req,
        arquivo(payload),
        { projectId: '1' },
        res() as any,
      ),
    ).rejects.toThrow('Nenhuma chave do Gemini configurada');
    expect(gerarPdf).not.toHaveBeenCalled();
    expect(quota.estornar).toHaveBeenCalledWith(7);
  });

  it('503 quando a IA responde sem nenhum dos itens pedidos', async () => {
    ai.avaliarChecklist.mockResolvedValue({
      avaliacao: { ...avaliacaoOk, itens: [] },
      modelo: 'm',
    });
    await expect(
      controller.uploadChecklist(req, arquivo(payload), {}, res() as any),
    ).rejects.toThrow(ServiceUnavailableException);
    expect(quota.estornar).toHaveBeenCalledWith(7);
  });

  it('gera o PDF mesmo se a IA esquecer um item (ele sai como nao avaliado)', async () => {
    ai.avaliarChecklist.mockResolvedValue({
      avaliacao: { ...avaliacaoOk, itens: [avaliacaoOk.itens[0]] },
      modelo: 'm',
    });
    await controller.uploadChecklist(req, arquivo(payload), {}, res() as any);
    const relatorio = gerarPdf.mock.calls[0][0];
    expect(relatorio.secoes[1].itens[0]).toMatchObject({
      codigo: 'D-07',
      origem: 'nao_avaliado',
    });
    expect(quota.estornar).not.toHaveBeenCalled();
  });

  it('front antigo (sem "marcado") conta tudo como marcado', async () => {
    ai.avaliarChecklist.mockResolvedValue({
      avaliacao: avaliacaoOk,
      modelo: 'm',
    });
    const antigo = [
      {
        categoria_nome: 'Segurança de dados',
        items: [{ codigo: 'S-01', titulo_item: 'a' }],
      },
    ];
    await controller.uploadChecklist(req, arquivo(antigo), {}, res() as any);
    expect(ai.avaliarChecklist.mock.calls[0][0]).toHaveLength(1);
  });
});
