import { Test } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { EncryptionService } from '../common/crypto/encryption.service';
import * as bcrypt from 'bcryptjs';
import * as geminiKey from '../services/gemini-key';

jest.mock('bcryptjs');

describe('UsersService', () => {
  let service: UsersService;
  const repo = {
    findOne: jest.fn(),
    create: jest.fn((x) => x),
    save: jest.fn(async (x) => ({ id: 1, ...x })),
    manager: { query: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: repo },
        { provide: EncryptionService, useValue: { encrypt: (v: string) => v, decrypt: (v: string) => v } },
      ],
    }).compile();
    service = moduleRef.get(UsersService);
  });

  const dto = { nome: 'A', email: 'a@a.com', perfil: 'dev', senha: '123456' } as any;

  it('create lanca Conflict quando o email ja existe', async () => {
    repo.findOne.mockResolvedValue({ id: 9, email: 'a@a.com' });
    await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
  });

  it('create hasheia a senha e nao retorna o hash', async () => {
    repo.findOne.mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('HASH');
    const res: any = await service.create(dto);
    expect(bcrypt.hash).toHaveBeenCalledWith('123456', 10);
    expect(res.senhaHash).toBeUndefined();
  });

  it('getSettings retorna hasGeminiKey=true quando ha chave', async () => {
    repo.findOne.mockResolvedValue({ id: 1, geminiApiKey: 'AIza...' });
    await expect(service.getSettings(1)).resolves.toEqual({ hasGeminiKey: true });
  });

  it('updateGeminiKey limpa a chave quando o valor e vazio', async () => {
    repo.findOne.mockResolvedValue({ id: 1 });
    await expect(service.updateGeminiKey(1, '   ')).resolves.toEqual({ hasGeminiKey: false });
  });

  describe('updateGeminiKey confere a chave antes de salvar', () => {
    let verificar: jest.SpyInstance;
    beforeEach(() => {
      repo.findOne.mockResolvedValue({ id: 1 });
      verificar = jest.spyOn(geminiKey, 'verificarChaveGemini');
    });
    afterEach(() => verificar.mockRestore());

    it('recusa chave de outra IA sem consultar o Google', async () => {
      await expect(service.updateGeminiKey(1, 'sk-proj-abc')).rejects.toThrow('OpenAI (ChatGPT)');
      expect(verificar).not.toHaveBeenCalled();
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('recusa chave que o Google diz que nao vale', async () => {
      verificar.mockResolvedValue('invalida');
      await expect(service.updateGeminiKey(1, 'AIzaErrada')).rejects.toThrow('O Google recusou essa chave');
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('salva chave valida', async () => {
      verificar.mockResolvedValue('valida');
      await expect(service.updateGeminiKey(1, 'AIzaBoa')).resolves.toEqual({ hasGeminiKey: true });
      expect(repo.save).toHaveBeenCalled();
    });

    it('salva com aviso quando o Google nao responde', async () => {
      verificar.mockResolvedValue('indeterminada');
      const r = await service.updateGeminiKey(1, 'AIzaTalvez');
      expect(r.hasGeminiKey).toBe(true);
      expect(r.aviso).toContain('Não foi possível confirmar');
    });
  });

  it('exportAccount devolve os dados do titular sem senha e sem o valor da chave do Gemini', async () => {
    repo.findOne.mockResolvedValue({
      id: 1,
      nome: 'A',
      email: 'a@a.com',
      perfil: 'dev',
      senha: 'HASH-SECRETO',
      geminiApiKey: 'AIza-SEGREDO',
      politicaVersao: '2026-10-23',
    });
    repo.manager.query
      .mockResolvedValueOnce([{ id: 10, nome: 'Projeto' }]) // projetos
      .mockResolvedValueOnce([{ id: 5, pergunta_codigo: 'S-01', resposta: 'JWT' }]) // respostas
      .mockResolvedValueOnce([]) // relatorios
      .mockResolvedValueOnce([]); // recomendacoes

    const out: any = await service.exportAccount(1);

    expect(out.formato).toBe('devcomply-export/1');
    expect(out.titular).toMatchObject({ id: 1, email: 'a@a.com', chaveGemini: { cadastrada: true } });
    expect(out.titular.consentimento.politicaPrivacidade.versao).toBe('2026-10-23');
    expect(out.projetos).toHaveLength(1);
    expect(out.respostasChecklist[0].pergunta_codigo).toBe('S-01');
    const json = JSON.stringify(out);
    expect(json).not.toContain('HASH-SECRETO');
    expect(json).not.toContain('AIza-SEGREDO');
    // Toda consulta e filtrada pelo titular (parametro $1 = id do usuario).
    for (const call of repo.manager.query.mock.calls) expect(call[1]).toEqual([1]);
  });
});
