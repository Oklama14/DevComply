import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Historico de relatorios por projeto.
 *
 * A tabela `relatorios` existia desde o schema inicial e nunca recebeu uma linha.
 * Ela passa a guardar cada relatorio gerado: data, modelo, indice (`pontuacao`), um
 * resumo para a lista e a evolucao do projeto, e o conteudo completo para montar o
 * PDF de novo sem chamar a IA.
 *
 * As chaves estrangeiras de `relatorios` e `recomendacoes` passam a apagar em
 * cascata: com NO ACTION, excluir um projeto que tivesse relatorio falhava.
 *
 * Idempotente: pode rodar em banco novo ou no de producao.
 */
export class RelatoriosHistorico1793232000000 implements MigrationInterface {
  name = 'RelatoriosHistorico1793232000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "relatorios" ADD COLUMN IF NOT EXISTS "criado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "relatorios" ADD COLUMN IF NOT EXISTS "modelo" character varying(80)`,
    );
    await queryRunner.query(`ALTER TABLE "relatorios" ADD COLUMN IF NOT EXISTS "resumo" jsonb`);
    await queryRunner.query(`ALTER TABLE "relatorios" ADD COLUMN IF NOT EXISTS "conteudo" jsonb`);
    await queryRunner.query(`ALTER TABLE "relatorios" ALTER COLUMN "pontuacao" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "relatorios" ALTER COLUMN "status" SET DEFAULT 'gerado'`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_relatorios_projeto_criado" ON "relatorios" ("projetoId", "criado_em")`,
    );

    await queryRunner.query(
      `ALTER TABLE "relatorios" DROP CONSTRAINT IF EXISTS "FK_29f4441903dfbc5d6d71bd926c9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "relatorios" ADD CONSTRAINT "FK_29f4441903dfbc5d6d71bd926c9" FOREIGN KEY ("projetoId") REFERENCES "projetos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "recomendacoes" DROP CONSTRAINT IF EXISTS "FK_89d2575ab3a63786381c1a29a35"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recomendacoes" ADD CONSTRAINT "FK_89d2575ab3a63786381c1a29a35" FOREIGN KEY ("relatorioId") REFERENCES "relatorios"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "recomendacoes" DROP CONSTRAINT IF EXISTS "FK_89d2575ab3a63786381c1a29a35"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recomendacoes" ADD CONSTRAINT "FK_89d2575ab3a63786381c1a29a35" FOREIGN KEY ("relatorioId") REFERENCES "relatorios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "relatorios" DROP CONSTRAINT IF EXISTS "FK_29f4441903dfbc5d6d71bd926c9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "relatorios" ADD CONSTRAINT "FK_29f4441903dfbc5d6d71bd926c9" FOREIGN KEY ("projetoId") REFERENCES "projetos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_relatorios_projeto_criado"`);
    await queryRunner.query(`ALTER TABLE "relatorios" ALTER COLUMN "status" DROP DEFAULT`);
    // Relatorio sem indice nao volta a caber em NOT NULL: zera antes de restaurar.
    await queryRunner.query(`UPDATE "relatorios" SET "pontuacao" = 0 WHERE "pontuacao" IS NULL`);
    await queryRunner.query(`ALTER TABLE "relatorios" ALTER COLUMN "pontuacao" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "relatorios" DROP COLUMN IF EXISTS "conteudo"`);
    await queryRunner.query(`ALTER TABLE "relatorios" DROP COLUMN IF EXISTS "resumo"`);
    await queryRunner.query(`ALTER TABLE "relatorios" DROP COLUMN IF EXISTS "modelo"`);
    await queryRunner.query(`ALTER TABLE "relatorios" DROP COLUMN IF EXISTS "criado_em"`);
  }
}
