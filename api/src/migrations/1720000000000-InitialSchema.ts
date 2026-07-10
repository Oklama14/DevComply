import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Baseline do schema atual (antes gerado via synchronize).
 * Idempotente: usa CREATE TABLE IF NOT EXISTS e adiciona as FKs apenas se
 * ainda nao existirem — assim roda com seguranca tanto no banco de producao
 * (que ja tem as tabelas) quanto em um banco novo.
 */
export class InitialSchema1720000000000 implements MigrationInterface {
  name = 'InitialSchema1720000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "usuarios" ("id" SERIAL NOT NULL, "nome" character varying(80) NOT NULL, "email" character varying(120) NOT NULL, "senha" character varying NOT NULL, "perfil" character varying(20) NOT NULL, CONSTRAINT "UQ_446adfc18b35418aac32ae0b7b5" UNIQUE ("email"), CONSTRAINT "PK_d7281c63c176e152e4c531594a8" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "artigos_lgpd" ("id" SERIAL NOT NULL, "artigo" character varying(50) NOT NULL, "titulo" character varying(200) NOT NULL, "descricao" text NOT NULL, CONSTRAINT "PK_101a2b348e9ed21db3397b7ffd1" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "projetos" ("id" SERIAL NOT NULL, "nome" character varying(100) NOT NULL, "descricao" text NOT NULL, "progresso" smallint NOT NULL DEFAULT '0', "usuarioId" integer, CONSTRAINT "PK_fb6b6aed4b30e10b976fe8bdf5b" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "checklist_perguntas" ("id" SERIAL NOT NULL, "codigo" character varying(10) NOT NULL, "pergunta" text NOT NULL, "artigo_id" integer NOT NULL, "descricao" text, "dica" text, CONSTRAINT "PK_7c19ff629352ae779cc3c6007f5" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "relatorios" ("id" SERIAL NOT NULL, "status" character varying(20) NOT NULL, "pontuacao" integer NOT NULL, "projetoId" integer, CONSTRAINT "PK_45c4346cde9bc12a1ece0c95b1d" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "checklist_respostas" ("id" SERIAL NOT NULL, "projetoId" integer NOT NULL, "perguntaId" integer NOT NULL, "resposta" text, "detalhesTecnicos" text, "conformidade" boolean NOT NULL DEFAULT false, "projeto_id" integer, "pergunta_id" integer, CONSTRAINT "PK_f8655355323df1ede6590ea6f69" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "recomendacoes" ("id" SERIAL NOT NULL, "tipo" character varying(20) NOT NULL, "descricao" text NOT NULL, "relatorioId" integer, CONSTRAINT "PK_61201669f6b75c00fd7b188e0c9" PRIMARY KEY ("id"))`);

    await this.addFkIfMissing(queryRunner, 'FK_714a65913c2ec7704ecde66f0f2',
      `ALTER TABLE "projetos" ADD CONSTRAINT "FK_714a65913c2ec7704ecde66f0f2" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await this.addFkIfMissing(queryRunner, 'FK_bde38b3d944be79b7fde46a632a',
      `ALTER TABLE "checklist_perguntas" ADD CONSTRAINT "FK_bde38b3d944be79b7fde46a632a" FOREIGN KEY ("artigo_id") REFERENCES "artigos_lgpd"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await this.addFkIfMissing(queryRunner, 'FK_29f4441903dfbc5d6d71bd926c9',
      `ALTER TABLE "relatorios" ADD CONSTRAINT "FK_29f4441903dfbc5d6d71bd926c9" FOREIGN KEY ("projetoId") REFERENCES "projetos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await this.addFkIfMissing(queryRunner, 'FK_7fce596c28e13a0783481b56a16',
      `ALTER TABLE "checklist_respostas" ADD CONSTRAINT "FK_7fce596c28e13a0783481b56a16" FOREIGN KEY ("projeto_id") REFERENCES "projetos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await this.addFkIfMissing(queryRunner, 'FK_42897148209f76c7c0469c62e30',
      `ALTER TABLE "checklist_respostas" ADD CONSTRAINT "FK_42897148209f76c7c0469c62e30" FOREIGN KEY ("pergunta_id") REFERENCES "checklist_perguntas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await this.addFkIfMissing(queryRunner, 'FK_89d2575ab3a63786381c1a29a35',
      `ALTER TABLE "recomendacoes" ADD CONSTRAINT "FK_89d2575ab3a63786381c1a29a35" FOREIGN KEY ("relatorioId") REFERENCES "relatorios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "recomendacoes" DROP CONSTRAINT IF EXISTS "FK_89d2575ab3a63786381c1a29a35"`);
    await queryRunner.query(`ALTER TABLE "checklist_respostas" DROP CONSTRAINT IF EXISTS "FK_42897148209f76c7c0469c62e30"`);
    await queryRunner.query(`ALTER TABLE "checklist_respostas" DROP CONSTRAINT IF EXISTS "FK_7fce596c28e13a0783481b56a16"`);
    await queryRunner.query(`ALTER TABLE "relatorios" DROP CONSTRAINT IF EXISTS "FK_29f4441903dfbc5d6d71bd926c9"`);
    await queryRunner.query(`ALTER TABLE "checklist_perguntas" DROP CONSTRAINT IF EXISTS "FK_bde38b3d944be79b7fde46a632a"`);
    await queryRunner.query(`ALTER TABLE "projetos" DROP CONSTRAINT IF EXISTS "FK_714a65913c2ec7704ecde66f0f2"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "recomendacoes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "checklist_respostas"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "relatorios"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "checklist_perguntas"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "projetos"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "artigos_lgpd"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "usuarios"`);
  }

  private async addFkIfMissing(queryRunner: QueryRunner, name: string, ddl: string): Promise<void> {
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${name}') THEN ${ddl.replace(/'/g, "''")}; END IF; END $$;`,
    );
  }
}
