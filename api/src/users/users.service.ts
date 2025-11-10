import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const exists = await this.repo.findOne({ where: { email: dto.email } });
    if (exists) {
      throw new Error('E-mail já cadastrado');
    }
    
    const user = this.repo.create({
      nome: dto.nome,
      email: dto.email,
      perfil: dto.perfil,
      senhaHash: await bcrypt.hash(dto.senha, 10),
    });
    
    return this.repo.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    // Incluindo senhaHash para validação de login
    return this.repo.findOne({ 
      where: { email },
      select: ['id', 'nome', 'email', 'senhaHash', 'perfil']
    });
  }

  async findOne(id: number): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  async updateProfile(id: number, dto: UpdateProfileDto): Promise<User> {
    const user = await this.findOne(id);
    if (!user) throw new Error('Usuário não encontrado');

    user.nome = dto.nome ?? user.nome;
    user.perfil = dto.perfil ?? user.perfil;

    return this.repo.save(user);
  }

  async changePassword(id: number, dto: ChangePasswordDto): Promise<void> {
    // Busca o usuário com a senha
    const user = await this.repo.findOne({ 
      where: { id },
      select: ['id', 'nome', 'email', 'senhaHash', 'perfil']
    });
    
    if (!user) throw new Error('Usuário não encontrado');

    const ok = await bcrypt.compare(dto.senhaAtual, user.senhaHash);
    if (!ok) throw new Error('Senha atual inválida');

    user.senhaHash = await bcrypt.hash(dto.novaSenha, 10);
    await this.repo.save(user);
  }
}