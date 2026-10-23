import { MigrationInterface, QueryRunner } from 'typeorm';
import { aplicarCatalogoLgpdCheck } from '../checklist/catalog/lgpd-check.catalog';

/**
 * Popula o checklist com itens do LGPD-Check (SBES 2021 / SBQS 2023): 3 perguntas
 * por secao, em 6 secoes (Transparencia, Processamento, Consentimento, Direitos
 * dos usuarios, Seguranca e Responsabilidade do controlador).
 *
 * - Adiciona `ordem` (secoes e itens), `referencia` e `obrigatorio` (itens).
 * - Converte in-place as 3 perguntas de exemplo do seed antigo nos itens
 *   equivalentes (C-03, T-03, T-09), preservando ids e respostas ja salvas.
 * - Garante `codigo` unico (o catalogo faz upsert por ele).
 *
 * Idempotente: pode rodar em banco novo ou no banco de producao.
 */
export class LgpdCheckCatalog1792800000000 implements MigrationInterface {
  name = 'LgpdCheckCatalog1792800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "artigos_lgpd" ADD COLUMN IF NOT EXISTS "ordem" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "checklist_perguntas" ADD COLUMN IF NOT EXISTS "referencia" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "checklist_perguntas" ADD COLUMN IF NOT EXISTS "obrigatorio" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "checklist_perguntas" ADD COLUMN IF NOT EXISTS "ordem" integer NOT NULL DEFAULT 0`,
    );

    await aplicarCatalogoLgpdCheck((sql, params) => queryRunner.query(sql, params));

    // Indice unico so se nao houver codigos duplicados (nao derruba o boot se houver).
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM "checklist_perguntas" GROUP BY "codigo" HAVING COUNT(*) > 1
        ) THEN
          CREATE UNIQUE INDEX IF NOT EXISTS "UQ_checklist_perguntas_codigo"
            ON "checklist_perguntas" ("codigo");
        ELSE
          RAISE WARNING 'checklist_perguntas tem codigos duplicados; indice unico nao criado.';
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Os itens inseridos sao mantidos: podem ter respostas de usuarios vinculadas.
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_checklist_perguntas_codigo"`);
    await queryRunner.query(`ALTER TABLE "checklist_perguntas" DROP COLUMN IF EXISTS "ordem"`);
    await queryRunner.query(`ALTER TABLE "checklist_perguntas" DROP COLUMN IF EXISTS "obrigatorio"`);
    await queryRunner.query(`ALTER TABLE "checklist_perguntas" DROP COLUMN IF EXISTS "referencia"`);
    await queryRunner.query(`ALTER TABLE "artigos_lgpd" DROP COLUMN IF EXISTS "ordem"`);
  }
}
