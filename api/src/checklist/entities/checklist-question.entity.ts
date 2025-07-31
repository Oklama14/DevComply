import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { LgpdArticle } from './lgpd-article.entity';
import { ChecklistResponse } from './checklist-response.entity';

@Entity({ name: 'checklist_perguntas' })
export class ChecklistQuestion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 10 })
  codigo: string;

  @Column({ type: 'text' })
  pergunta: string;

  // Relação: Várias perguntas pertencem a um artigo
  @ManyToOne(() => LgpdArticle, article => article.perguntas)
  artigoLgpd: LgpdArticle;

  // Relação: Uma pergunta pode ter várias respostas
  @OneToMany(() => ChecklistResponse, response => response.pergunta)
  respostas: ChecklistResponse[];
}
