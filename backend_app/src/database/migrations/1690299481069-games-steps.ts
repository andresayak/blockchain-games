import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

const name = "games_steps";

export class GamesSteps1690299481069 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name,
        columns: [
          {
            name: "id",
            type: "int",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment",
          },
          {
            name: "game_id",
            type: "integer",
          },
          {
            name: "block_number",
            type: "integer",
          },
          {
            name: "transaction_hash",
            type: "varchar(128)",
            isNullable: true,
          },
          {
            name: "params",
            type: "jsonb",
          },
          {
            name: "created_at",
            type: "timestamptz",
            default: "now()",
          },
        ],
      }),
    );
    await queryRunner.createForeignKey(
      name,
      new TableForeignKey({
        columnNames: ["game_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "games",
        onDelete: "CASCADE",
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable(name);
    for (const foreignKey of table.foreignKeys) {
      await queryRunner.dropForeignKey(name, foreignKey);
    }
    await queryRunner.dropTable(name);
  }
}
