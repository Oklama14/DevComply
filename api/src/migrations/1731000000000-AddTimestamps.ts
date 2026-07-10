import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTimestamps1731000000000 implements MigrationInterface {
  name = 'AddTimestamps1731000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "projetos" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "projetos" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_projetos_usuarioId" ON "projetos" ("usuarioId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_projetos_usuarioId"`);
    await queryRunner.query(`ALTER TABLE "projetos" DROP COLUMN IF EXISTS "updated_at"`);
    await queryRunner.query(`ALTER TABLE "projetos" DROP COLUMN IF EXISTS "created_at"`);
    await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN IF EXISTS "updated_at"`);
    await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN IF EXISTS "created_at"`);
  }
}
