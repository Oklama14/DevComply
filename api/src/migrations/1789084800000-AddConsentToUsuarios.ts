import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Registro de consentimento (art. 8o, §1o da LGPD).
 *
 * Ate aqui a tela de cadastro exigia o aceite da politica e dos termos, mas o valor
 * marcado nunca saia do navegador — do ponto de vista da lei, um aceite que nao e
 * registrado e um aceite que nao aconteceu. As colunas sao nulas porque, para os
 * cadastros anteriores a esta migration, nao ha consentimento registrado. Preencher
 * retroativamente seria inventar prova.
 */
export class AddConsentToUsuarios1789084800000 implements MigrationInterface {
  name = 'AddConsentToUsuarios1789084800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "politica_versao" character varying(30)`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "politica_aceita_em" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "termos_versao" character varying(30)`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "termos_aceito_em" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "usuarios" DROP COLUMN IF EXISTS "termos_aceito_em"`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios" DROP COLUMN IF EXISTS "termos_versao"`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios" DROP COLUMN IF EXISTS "politica_aceita_em"`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios" DROP COLUMN IF EXISTS "politica_versao"`,
    );
  }
}
