import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGeminiApiKeyToUsuarios1730000000000 implements MigrationInterface {
  name = 'AddGeminiApiKeyToUsuarios1730000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "gemini_api_key" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "usuarios" DROP COLUMN IF EXISTS "gemini_api_key"`,
    );
  }
}
