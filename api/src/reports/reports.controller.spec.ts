import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { AiService, IaIndisponivelError } from '@/services/ai.service';
import { ProjectsService } from '@/projects/projects.service';
import { UsersService } from '@/users/users.service';
import { Conformidade } from '@/types/ai.types';
import { ConfigService } from '@nestjs/config';
import { ReportQuotaService } from './report-rate-limit.guard';

describe('ReportsController', () => {
  let controller: ReportsController;
  const ai = { gerarJSON: jest.fn(), gerarPDF: jest.fn() };
  const users = { getGeminiKey: jest.fn() };
  const projects = { findOne: jest.fn() };
  const quota = { consumir: jest.fn(() => ({ ok: true })), estornar: jest.fn(), limite: 10 };

  const req = { user: { userId: 7 } };
  const res = () => ({ setHeader: jest.fn(), send: jest.fn((b) => b) });
  const arquivo = (payload: unknown) => ({ buffer: Buffer.from(JSON.stringify(payload)) });
  const payload = [
    { categoria_nome: 'Segurança de dados', items: [{ codigo: 'S-17', titulo_item: 'TLS?', resposta_implementacao: 'Sim' }] },
    { categoria_nome: 'Direitos dos usuários', items: [{ codigo: 'D-06', titulo_item: 'Portabilidade?' }] },
  ];

  beforeEach(async () => {
    jest.resetAllMocks();
    users.getGeminiKey.mockResolvedValue(null);
    projects.findOne.mockResolvedValue({ id: 1 });
    ai.gerarPDF.mockResolvedValue(Buffer.from('%PDF'));

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

  it('deve ser definido', () => {
    expect(controller).toBeDefined();
  });

  it('gera o PDF com o nome do projeto e um nome de arquivo ASCII', async () => {
    ai.gerarJSON.mockResolvedValue([{ titulo: 't', resumo: 'r', em_conformidade: Conformidade.HIGH }]);
    const r = res();

    await controller.uploadChecklist(req, arquivo(payload), { projectId: '1', projectName: 'Avaliação 漢字' }, r as any);

    expect(ai.gerarJSON).toHaveBeenCalledTimes(2);
    expect(ai.gerarPDF).toHaveBeenCalledWith(expect.any(Array), 'Avaliação 漢字');
    const disposition = r.setHeader.mock.calls.find(([h]) => h === 'Content-Disposition')[1];
    expect(disposition).toBe('attachment; filename="relatorio-lgpd-1-Avaliacao_.pdf"');
    // O codigo do item vai para o prompt.
    expect(ai.gerarJSON.mock.calls[0][0].resposta_implementacao).toContain('[S-17]');
  });

  it('marca como "Não avaliado" so a categoria que falhou', async () => {
    ai.gerarJSON
      .mockResolvedValueOnce([{ titulo: 't', resumo: 'r', em_conformidade: Conformidade.HIGH }])
      .mockRejectedValueOnce(new IaIndisponivelError('limite', 'cota'));

    await controller.uploadChecklist(req, arquivo(payload), { projectId: '1' }, res() as any);

    const respostas = ai.gerarPDF.mock.calls[0][0];
    expect(respostas).toHaveLength(2);
    expect(respostas[1]).toMatchObject({ em_conformidade: Conformidade.NAO_AVALIADO });
  });

  it('responde 503 com o motivo quando a IA falha em todas as categorias (em vez de um PDF vazio)', async () => {
    ai.gerarJSON.mockRejectedValue(
      new IaIndisponivelError('Nenhuma chave do Gemini configurada. Cadastre sua chave em Configurações.', 'sem-chave'),
    );

    await expect(
      controller.uploadChecklist(req, arquivo(payload), { projectId: '1' }, res() as any),
    ).rejects.toThrow(ServiceUnavailableException);
    expect(ai.gerarPDF).not.toHaveBeenCalled();
    // A tentativa que falhou inteira nao conta no limite por hora.
    expect(quota.estornar).toHaveBeenCalledWith(7);
  });

  it('nao estorna quando ao menos uma secao foi avaliada', async () => {
    ai.gerarJSON
      .mockResolvedValueOnce([{ titulo: 't', resumo: 'r', em_conformidade: Conformidade.HIGH }])
      .mockRejectedValueOnce(new IaIndisponivelError('limite', 'cota'));
    await controller.uploadChecklist(req, arquivo(payload), { projectId: '1' }, res() as any);
    expect(quota.estornar).not.toHaveBeenCalled();
  });
});
