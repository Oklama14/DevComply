import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcryptjs';
import { EncryptionService } from '../common/crypto/encryption.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
    private readonly encryption: EncryptionService,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    try {
      const exists = await this.repo.findOne({ where: { email: dto.email } });
      if (exists) {
        throw new ConflictException('E-mail ja cadastrado');
      }

      const senhaHash = await bcrypt.hash(dto.senha, 10);

      const user = this.repo.create({
        nome: dto.nome,
        email: dto.email,
        perfil: dto.perfil,
        senhaHash,
      });

      const saved = await this.repo.save(user);
      delete (saved as Partial<User>).senhaHash;
      return saved;
    } catch (err) {
      if (err instanceof ConflictException) throw err;
      this.logger.error(
        `Falha ao criar usuario (${dto?.email}): ${err?.message}`,
        err?.stack,
      );
      throw new InternalServerErrorException('Erro ao criar usuario');
    }
  }

  async getSettings(userId: number): Promise<{ hasGeminiKey: boolean }> {
    const user = await this.repo.findOne({
      where: { id: userId },
      select: ['id', 'geminiApiKey'],
    });
    if (!user) throw new NotFoundException('Usuario nao encontrado');
    return { hasGeminiKey: !!user.geminiApiKey };
  }

  async updateGeminiKey(
    userId: number,
    apiKey?: string,
  ): Promise<{ hasGeminiKey: boolean }> {
    const user = await this.findOne(userId);
    if (!user) throw new NotFoundException('Usuario nao encontrado');
    const clean = apiKey?.trim();
    user.geminiApiKey = clean ? this.encryption.encrypt(clean) : null;
    await this.repo.save(user);
    return { hasGeminiKey: !!user.geminiApiKey };
  }

  /** Uso interno (geracao de relatorios). Retorna a chave crua do usuario. */
  async getGeminiKey(userId: number): Promise<string | null> {
    const user = await this.repo.findOne({
      where: { id: userId },
      select: ['id', 'geminiApiKey'],
    });
    return user?.geminiApiKey ? this.encryption.decrypt(user.geminiApiKey) : null;
  }

  /** Exclusao de conta (LGPD): remove o usuario e todos os dados vinculados. */
  async deleteAccount(userId: number): Promise<void> {
    await this.repo.manager.transaction(async (m) => {
      const sub = `SELECT id FROM projetos WHERE "usuarioId" = $1`;
      await m.query(
        `DELETE FROM recomendacoes WHERE "relatorioId" IN (SELECT id FROM relatorios WHERE "projetoId" IN (${sub}))`,
        [userId],
      );
      await m.query(`DELETE FROM relatorios WHERE "projetoId" IN (${sub})`, [userId]);
      await m.query(
        `DELETE FROM checklist_respostas WHERE "projeto_id" IN (${sub}) OR "projetoId" IN (${sub})`,
        [userId],
      );
      await m.query(`DELETE FROM projetos WHERE "usuarioId" = $1`, [userId]);
      await m.query(`DELETE FROM usuarios WHERE id = $1`, [userId]);
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({
      where: { email },
      select: ['id', 'nome', 'email', 'senhaHash', 'perfil'],
    });
  }

  async findOne(id: number): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  async updateProfile(id: number, dto: UpdateProfileDto): Promise<User> {
    const user = await this.findOne(id);
    if (!user) throw new NotFoundException('Usuario nao encontrado');

    user.nome = dto.nome ?? user.nome;
    user.perfil = dto.perfil ?? user.perfil;

    return this.repo.save(user);
  }

  async changePassword(id: number, dto: ChangePasswordDto): Promise<void> {
    const user = await this.repo.findOne({
      where: { id },
      select: ['id', 'nome', 'email', 'senhaHash', 'perfil'],
    });

    if (!user) throw new NotFoundException('Usuario nao encontrado');

    const ok = await bcrypt.compare(dto.senhaAtual, user.senhaHash);
    if (!ok) throw new UnauthorizedException('Senha atual invalida');

    user.senhaHash = await bcrypt.hash(dto.novaSenha, 10);
    await this.repo.save(user);
  }
}
