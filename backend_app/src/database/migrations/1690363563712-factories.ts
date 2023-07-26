import { MigrationInterface, QueryRunner, Table } from "typeorm";

const name = "factories";
export class Factories1690363563712 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: name,
        columns: [
          {
            name: "id",
            type: "int",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment",
          },
          {
            name: "type",
            type: "varchar(128)",
            isNullable: true,
          },
          {
            name: "address",
            type: "varchar(128)",
            isNullable: true,
          },
          {
            name: "chainId",
            type: "integer",
          },
          {
            name: "created_at",
            type: "timestamptz",
            default: "now()",
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(name);
  }
}
