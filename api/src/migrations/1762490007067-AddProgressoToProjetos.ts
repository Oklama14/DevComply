import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Mantida por compatibilidade historica. O baseline (InitialSchema) ja cria a
 * coluna "progresso"; aqui usamos IF NOT EXISTS para ser idempotente e nao
 * conflitar em bancos novos.
 */
export class AddProgressoToProjetos1762490007067 implements MigrationInterface {
  name = 'AddProgressoToProjetos1762490007067';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "projetos" ADD COLUMN IF NOT EXISTS "progresso" smallint NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "projetos" DROP COLUMN IF EXISTS "progresso"`);
  }
}
