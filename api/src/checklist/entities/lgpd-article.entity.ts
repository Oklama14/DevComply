import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ChecklistQuestion } from './checklist-question.entity';

@Entity('artigos_lgpd')
export class LgpdArticle {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 10 })
  artigo: string;

  @Column({ length: 200 })
  titulo: string;

  @Column('text')
  descricao: string;

  // Esta é a relação que estava em falta.
  // Ela diz ao TypeORM que um LgpdArticle pode ter muitas ChecklistQuestions.
  @OneToMany(() => ChecklistQuestion, (question) => question.artigo)
  questoes: ChecklistQuestion[];
}
