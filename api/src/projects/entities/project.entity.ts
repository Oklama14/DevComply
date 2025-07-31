
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { User } from '@/users/entities/user.entity';
import { Report } from '@/reports/entities/report.entity';
import { ChecklistResponse } from '@/checklist/entities/checklist-response.entity';

@Entity({ name: 'projetos' })
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  nome: string;

  @Column({ type: 'text' })
  descricao: string;

  // Relação: Vários projetos pertencem a um usuário
  @ManyToOne(() => User, user => user.projetos)
  usuario: User;

  // Relação: Um projeto pode ter vários relatórios
  @OneToMany(() => Report, report => report.projeto)
  relatorios: Report[];

  // Relação: Um projeto pode ter várias respostas de checklist
  @OneToMany(() => ChecklistResponse, response => response.projeto)
  respostasChecklist: ChecklistResponse[];
}