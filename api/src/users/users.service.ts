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
import {
  POLITICA_PRIVACIDADE_VERSAO,
  TERMOS_USO_VERSAO,
} from './consent.constants';

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

      // O aceite e carimbado aqui, com a versao que o servidor considera vigente e
      // a hora do servidor. O DTO ja recusou o cadastro sem aceite, entao chegar
      // aqui significa que os dois documentos foram aceitos.
      const aceitoEm = new Date();

      const user = this.repo.create({
        nome: dto.nome,
        email: dto.email,
        perfil: dto.perfil,
        senhaHash,
        politicaVersao: POLITICA_PRIVACIDADE_VERSAO,
        politicaAceitaEm: aceitoEm,
        termosVersao: TERMOS_USO_VERSAO,
        termosAceitoEm: aceitoEm,
      });

      const saved = await this.repo.save(user);
      delete (saved as Partial<User>).senhaHash;
      return saved;
    } catch (err) {
      if (err instanceof ConflictException) throw err;
      // Sem o e-mail do titular: a mensagem ia para o agregador de logs do provedor
      // e criava uma segunda copia de dado pessoal, com prazo de retencao que
      // ninguem definiu (art. 6o, III). O stack abaixo ja da o contexto de depuracao.
      this.logger.error(`Falha ao criar usuario: ${err?.message}`, err?.stack);
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

  /**
   * Portabilidade (art. 18, II e V): devolve tudo o que o sistema guarda sobre o
   * titular, em formato que da para levar embora.
   *
   * Os campos sao montados um a um de proposito. Espalhar a entidade inteira com
   * spread funcionaria hoje, porque senha e chave do Gemini estao com select:false —
   * e passaria a vazar as duas no dia em que alguem mudasse isso.
   */
  async exportAccount(userId: number): Promise<Record<string, unknown>> {
    const user = await this.findOne(userId);
    if (!user) throw new NotFoundException('Usuario nao encontrado');

    const m = this.repo.manager;
    const doTitular = `SELECT id FROM projetos WHERE "usuarioId" = $1`;

    const projetos = await m.query(
      `SELECT id, nome, descricao, progresso, created_at, updated_at
         FROM projetos WHERE "usuarioId" = $1 ORDER BY id`,
      [userId],
    );

    // As colunas de relacionamento existem duplicadas em checklist_respostas
    // (projetoId e projeto_id); o COALESCE cobre as duas ate a consolidacao.
    const respostasChecklist = await m.query(
      `SELECT r.id,
              COALESCE(r."projetoId", r.projeto_id)   AS projeto_id,
              p.codigo                                 AS pergunta_codigo,
              p.pergunta                               AS pergunta,
              r.resposta,
              r."detalhesTecnicos"                     AS detalhes_tecnicos,
              r.conformidade
         FROM checklist_respostas r
         LEFT JOIN checklist_perguntas p
           ON p.id = COALESCE(r."perguntaId", r.pergunta_id)
        WHERE COALESCE(r."projetoId", r.projeto_id) IN (${doTitular})
        ORDER BY r.id`,
      [userId],
    );

    const relatorios = await m.query(
      `SELECT id, status, pontuacao, "projetoId" AS projeto_id
         FROM relatorios WHERE "projetoId" IN (${doTitular}) ORDER BY id`,
      [userId],
    );

    const recomendacoes = await m.query(
      `SELECT id, tipo, descricao, "relatorioId" AS relatorio_id
         FROM recomendacoes
        WHERE "relatorioId" IN (
                SELECT id FROM relatorios WHERE "projetoId" IN (${doTitular})
              )
        ORDER BY id`,
      [userId],
    );

    return {
      exportadoEm: new Date().toISOString(),
      formato: 'devcomply-export/1',
      titular: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        perfil: user.perfil,
        criadoEm: user.createdAt,
        atualizadoEm: user.updatedAt,
        consentimento: {
          politicaPrivacidade: {
            versao: user.politicaVersao ?? null,
            aceitaEm: user.politicaAceitaEm ?? null,
          },
          termosDeUso: {
            versao: user.termosVersao ?? null,
            aceitoEm: user.termosAceitoEm ?? null,
          },
        },
      },
      projetos,
      respostasChecklist,
      relatorios,
      recomendacoes,
    };
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
