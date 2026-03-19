import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCityToHazards1738400000000 implements MigrationInterface {
  name = 'AddCityToHazards1738400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "hazards" ADD COLUMN "city" character varying
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_hazards_city" ON "hazards" ("city")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_hazards_city"`);
    await queryRunner.query(`ALTER TABLE "hazards" DROP COLUMN "city"`);
  }
}
