import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;
  const usersService = { findByEmail: jest.fn(), create: jest.fn() };
  const jwtService = { sign: jest.fn(() => 'signed.jwt.token') };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  it('login retorna access_token com credenciais validas', async () => {
    usersService.findByEmail.mockResolvedValue({ id: 1, email: 'a@a.com', senhaHash: 'hash' });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const res = await service.login('a@a.com', 'senha');

    expect(res).toEqual({ access_token: 'signed.jwt.token' });
    expect(jwtService.sign).toHaveBeenCalledWith({ sub: 1, email: 'a@a.com' });
  });

  it('login lanca Unauthorized se usuario nao existe', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    await expect(service.login('x@x.com', 's')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('login lanca Unauthorized se a senha esta incorreta', async () => {
    usersService.findByEmail.mockResolvedValue({ id: 1, email: 'a@a.com', senhaHash: 'hash' });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    await expect(service.login('a@a.com', 'errada')).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
