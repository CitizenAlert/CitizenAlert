import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPushToken1738200000000 implements MigrationInterface {
  name = 'AddPushToken1738200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "pushToken" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "pushToken"`);
  }
}
