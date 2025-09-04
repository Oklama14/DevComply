import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { LgpdArticle } from './lgpd-article.entity';

@Entity('checklist_perguntas')
export class ChecklistQuestion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 10 })
  codigo: string;

  @Column('text')
  pergunta: string;

  @Column({ name: 'artigo_id' }) // Mapeia a coluna de chave estrangeira
  artigoId: number;

  // Ela diz ao TypeORM que muitas ChecklistQuestions pertencem a um LgpdArticle.
  @ManyToOne(() => LgpdArticle, (article) => article.questoes)
  @JoinColumn({ name: 'artigo_id' }) // Especifica qual coluna armazena a relação
  artigo: LgpdArticle;
  respostas: any;
}
