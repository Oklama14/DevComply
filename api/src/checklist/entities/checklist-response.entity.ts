import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { ChecklistQuestion } from './checklist-question.entity';

@Entity('checklist_respostas')
export class ChecklistResponse {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  projetoId: number; // ou projectId

  @Column()
  perguntaId: number;

  @Column({ type: 'text', nullable: true })
  resposta: string | null;

  @Column({ type: 'text', nullable: true })
  detalhesTecnicos: string | null;

  @Column({ type: 'boolean', default: false })
  conformidade: boolean;
  @ManyToOne(() => Project, (project) => project.respostas)
  @JoinColumn({ name: 'projeto_id' })
  projeto: Project;

  @ManyToOne(() => ChecklistQuestion, (pergunta) => pergunta.respostas)
  @JoinColumn({ name: 'pergunta_id' })
  pergunta: ChecklistQuestion;
}
