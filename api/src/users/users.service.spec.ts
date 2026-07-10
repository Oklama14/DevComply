import { Test } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { EncryptionService } from '../common/crypto/encryption.service';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

describe('UsersService', () => {
  let service: UsersService;
  const repo = {
    findOne: jest.fn(),
    create: jest.fn((x) => x),
    save: jest.fn(async (x) => ({ id: 1, ...x })),
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
});
