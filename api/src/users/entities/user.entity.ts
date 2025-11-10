import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
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

  @OneToMany(() => Project, project => project.usuario)
  projetos: Project[];
}