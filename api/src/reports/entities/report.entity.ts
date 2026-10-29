import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Project } from '@/projects/entities/project.entity';
import { Recommendation } from './recommendation.entity';
import type { RelatorioGuardado, ResumoRelatorio } from '../relatorio-historico';

/**
 * Historico de relatorios: cada relatorio gerado fica guardado com o resumo (para a
 * lista e a evolucao do projeto) e o conteudo completo (para baixar o PDF de novo
 * sem outra chamada a IA). As colunas `status` e `pontuacao` vem da tabela original.
 */
@Entity({ name: 'relatorios' })
@Index('IDX_relatorios_projeto_criado', ['projetoId', 'criadoEm'])
export class Report {
  @PrimaryGeneratedColumn()
  id: number;

  /** 'gerado' para todo relatorio do historico. */
  @Column({ length: 20, default: 'gerado' })
  status: string;

  /** Indice de conformidade (0 a 100); null quando nenhum item foi avaliado. */
  @Column({ type: 'int', nullable: true })
  pontuacao: number | null;

  @Column({ name: 'projetoId', type: 'int', nullable: true })
  projetoId: number | null;

  // Excluir o projeto apaga o historico dele.
  @ManyToOne(() => Project, (project) => project.relatorios, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projetoId' })
  projeto: Project;

  @CreateDateColumn({ name: 'criado_em', type: 'timestamptz' })
  criadoEm: Date;

  /** Modelo do Gemini que fez a avaliacao. */
  @Column({ type: 'varchar', length: 80, nullable: true })
  modelo: string | null;

  @Column({ type: 'jsonb', nullable: true })
  resumo: ResumoRelatorio | null;

  // Fora das consultas comuns: a lista do historico nao precisa carregar o relatorio inteiro.
  @Column({ type: 'jsonb', nullable: true, select: false })
  conteudo: RelatorioGuardado | null;

  @OneToMany(() => Recommendation, (recommendation) => recommendation.relatorio)
  recomendacoes: Recommendation[];
}
