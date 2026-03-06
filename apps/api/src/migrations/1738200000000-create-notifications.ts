import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotifications1738200000000 implements MigrationInterface {
  name = 'CreateNotifications1738200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."notifications_type_enum" AS ENUM(
        'hazard_created',
        'hazard_status_changed',
        'hazard_nearby',
        'hazard_comment'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" "public"."notifications_type_enum" NOT NULL,
        "title" character varying NOT NULL,
        "message" character varying NOT NULL,
        "read" boolean NOT NULL DEFAULT false,
        "userId" uuid,
        "hazardId" uuid,
        "data" json,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "notifications"
      ADD CONSTRAINT "FK_notifications_user"
      FOREIGN KEY ("userId")
      REFERENCES "users"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "notifications"
      ADD CONSTRAINT "FK_notifications_hazard"
      FOREIGN KEY ("hazardId")
      REFERENCES "hazards"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_notifications_userId" ON "notifications" ("userId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_notifications_read" ON "notifications" ("read")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_notifications_createdAt" ON "notifications" ("createdAt")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_notifications_createdAt"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_notifications_read"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_notifications_userId"`);
    await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_hazard"`);
    await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_user"`);
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
  }
}
