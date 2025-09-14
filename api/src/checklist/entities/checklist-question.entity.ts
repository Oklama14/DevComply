import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { LgpdArticle } from './lgpd-article.entity';
import { ChecklistResponse } from './checklist-response.entity';

@Entity('checklist_perguntas')
export class ChecklistQuestion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 10 })
  codigo: string;

  @Column({ type: 'text' })
  pergunta: string;

  @Column({ name: 'artigo_id' })
  artigoId: number;

  @ManyToOne(() => LgpdArticle, (article) => article.questoes)
  @JoinColumn({ name: 'artigo_id' })
  artigo: LgpdArticle;

  // Adiciona a relação inversa que estava em falta
  @OneToMany(() => ChecklistResponse, (response) => response.pergunta)
  respostas: ChecklistResponse[];
}
