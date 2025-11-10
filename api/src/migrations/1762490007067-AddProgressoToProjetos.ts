import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddProgressoToProjetos1710000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Add the column (nullable at first)
    await queryRunner.addColumn(
      "projetos",
      new TableColumn({
        name: "progresso",
        type: "smallint",
        isNullable: true,
        default: 0,
      })
    );

    // Step 2: Update existing rows to 0 (backfill)
    await queryRunner.query(`UPDATE projetos SET progresso = 0 WHERE progresso IS NULL`);

    // Step 3: Make column NOT NULL
    await queryRunner.changeColumn(
      "projetos",
      "progresso",
      new TableColumn({
        name: "progresso",
        type: "smallint",
        isNullable: false,
        default: 0,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn("projetos", "progresso");
  }
}
