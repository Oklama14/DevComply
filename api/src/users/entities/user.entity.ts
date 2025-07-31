
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

  @Column({ length: 20 })
  perfil: string;

  // Relação: Um usuário pode ter vários projetos
  @OneToMany(() => Project, project => project.usuario)
  projetos: Project[];
}
