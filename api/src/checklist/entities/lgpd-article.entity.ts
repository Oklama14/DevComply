import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ChecklistQuestion } from './checklist-question.entity';

@Entity({ name: 'artigos_lgpd' })
export class LgpdArticle {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 10 })
  artigo: string;

  @Column({ length: 200 })
  titulo: string;

  @Column({ type: 'text' })
  descricao: string;

  // Relação: Um artigo pode ter várias perguntas de checklist
  @OneToMany(() => ChecklistQuestion, question => question.artigoLgpd)
  perguntas: ChecklistQuestion[];
}
