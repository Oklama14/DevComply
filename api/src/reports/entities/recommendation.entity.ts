import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Report } from './report.entity';

@Entity({ name: 'recomendacoes' })
export class Recommendation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 20 })
  tipo: string;

  @Column({ type: 'text' })
  descricao: string;

  // Relação: Várias recomendações pertencem a um relatório
  @ManyToOne(() => Report, report => report.recomendacoes)
  relatorio: Report;
}
