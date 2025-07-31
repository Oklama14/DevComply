// Ficheiro: api/src/checklist/entities/checklist-response.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Project } from '@/projects/entities/project.entity';
import { ChecklistQuestion } from './checklist-question.entity';

@Entity({ name: 'checklist_respostas' })
export class ChecklistResponse {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  resposta: string;

  @Column({ default: false })
  conformidade: boolean;

  // Relação: Várias respostas pertencem a um projeto
  @ManyToOne(() => Project, project => project.respostasChecklist)
  projeto: Project;

  // Relação: Várias respostas pertencem a uma pergunta
  @ManyToOne(() => ChecklistQuestion, question => question.respostas)
  pergunta: ChecklistQuestion;
}
