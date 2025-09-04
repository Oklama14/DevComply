import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { ChecklistQuestion } from './checklist-question.entity';

@Entity('checklist_respostas')
export class ChecklistResponse {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text', { nullable: true })
  resposta: string;

  @Column({ default: false })
  conformidade: boolean;

  // Relação: Muitas respostas pertencem a um projeto
  @ManyToOne(() => Project, (projeto) => projeto.respostas)
  projeto: Project;

  // Relação: Muitas respostas pertencem a uma pergunta
  @ManyToOne(() => ChecklistQuestion, (pergunta) => pergunta.respostas)
  pergunta: ChecklistQuestion;
}
