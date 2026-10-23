import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { LgpdArticle } from './lgpd-article.entity';
import { ChecklistResponse } from './checklist-response.entity';

@Entity('checklist_perguntas')
export class ChecklistQuestion {
  @PrimaryGeneratedColumn()
  id: number;

  // Codigo do item no LGPD-Check (ex.: T-01, S-17). Unico: o catalogo faz upsert por ele.
  @Index('UQ_checklist_perguntas_codigo', { unique: true })
  @Column({ length: 10 })
  codigo: string;

  @Column({ type: 'text' })
  pergunta: string;

  @Column({ name: 'artigo_id' })
  artigoId: number;

  @Column({ type: 'text', nullable: true })
  descricao: string | null;

  // Recomendacao do LGPD-Check para atender o item.
  @Column({ type: 'text', nullable: true })
  dica: string | null;

  // Artigos da LGPD relacionados ao item (ex.: "Art. 18, V").
  @Column({ type: 'varchar', length: 100, nullable: true })
  referencia: string | null;

  // false = item opcional (boa pratica), true = exigido pela LGPD.
  @Column({ type: 'boolean', default: true })
  obrigatorio: boolean;

  @Column({ type: 'int', default: 0 })
  ordem: number;

  @ManyToOne(() => LgpdArticle, (article) => article.questoes)
  @JoinColumn({ name: 'artigo_id' })
  artigo: LgpdArticle;

  // Adiciona a relação inversa que estava em falta
  @OneToMany(() => ChecklistResponse, (response) => response.pergunta)
  respostas: ChecklistResponse[];
}
