import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Project } from '@/projects/entities/project.entity';

@Entity({ name: 'usuarios' })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 80 })
  nome: string;

  @Column({ length: 120, unique: true })
  email: string;

  // Mapeando a coluna 'senha' do banco para propriedade 'senhaHash'
  @Column({ name: 'senha', select: false })
  senhaHash: string;

  @Column({ length: 20 })
  perfil: string;

  // Chave da API do Gemini do proprio usuario (opcional). Nunca retornada por padrao.
  @Column({ name: 'gemini_api_key', type: 'text', nullable: true, select: false })
  geminiApiKey?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Project, project => project.usuario)
  projetos: Project[];
}