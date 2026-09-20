import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Project } from '@/projects/entities/project.entity';

@Entity({ name: 'usuarios' })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 80 })
  nome: string;

  @Column({ length: 120, unique: true })
  email: string;

  // Mapeando a coluna 'senha' do banco para propriedade 'senhaHash'
  @Column({ name: 'senha', select: false })
  senhaHash: string;

  @Column({ length: 20 })
  perfil: string;

  // Chave da API do Gemini do proprio usuario (opcional). Nunca retornada por padrao.
  @Column({ name: 'gemini_api_key', type: 'text', nullable: true, select: false })
  geminiApiKey?: string | null;

  // Consentimento (art. 8o, §1o): guardar apenas "aceitou" nao demonstra nada. A
  // versao do texto e o carimbo de tempo sao o que permite dizer, depois, a qual
  // documento o titular consentiu e quando. Nulo nos cadastros anteriores a estas
  // colunas — para eles nao existe consentimento registrado, e o relatorio deve
  // poder dizer isso.
  @Column({ name: 'politica_versao', type: 'varchar', length: 30, nullable: true })
  politicaVersao?: string | null;

  @Column({ name: 'politica_aceita_em', type: 'timestamp', nullable: true })
  politicaAceitaEm?: Date | null;

  @Column({ name: 'termos_versao', type: 'varchar', length: 30, nullable: true })
  termosVersao?: string | null;

  @Column({ name: 'termos_aceito_em', type: 'timestamp', nullable: true })
  termosAceitoEm?: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Project, project => project.usuario)
  projetos: Project[];
}