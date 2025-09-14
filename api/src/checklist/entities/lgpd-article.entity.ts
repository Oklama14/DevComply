import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ChecklistQuestion } from './checklist-question.entity';

@Entity('artigos_lgpd')
export class LgpdArticle {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  artigo: string;

  @Column({ length: 200 })
  titulo: string;

  @Column({ type: 'text' })
  descricao: string;


  // Define a relação: um artigo (categoria) tem muitas questões.
  @OneToMany(() => ChecklistQuestion, (question) => question.artigo)
  questoes: ChecklistQuestion[];
}

