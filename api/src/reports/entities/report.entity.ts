import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Project } from '@/projects/entities/project.entity';
import { Recommendation } from './recommendation.entity';

@Entity({ name: 'relatorios' })
export class Report {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 20 })
  status: string;

  @Column()
  pontuacao: number;

  @ManyToOne(() => Project, project => project.relatorios)
  projeto: Project;

  @OneToMany(() => Recommendation, recommendation => recommendation.relatorio)
  recomendacoes: Recommendation[];
}
