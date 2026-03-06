import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1738800000000 implements MigrationInterface {
  name = 'InitialSchema1738800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      CREATE TYPE "hazard_type" AS ENUM (
        'inondation',
        'fuite_eau',
        'arbre_tombe',
        'depot_sauvage',
        'nid_de_poule',
        'eclairage_public_defectueux',
        'feu_tricolore_panne',
        'trottoir_voirie_degrade',
        'mobilier_urbain_deteriore',
        'nuisibles_insalubrite'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "hazard_status" AS ENUM (
        'active',
        'resolved',
        'archived'
      )
    `);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "password" character varying NOT NULL,
        "firstName" character varying NOT NULL,
        "lastName" character varying NOT NULL,
        "phoneNumber" character varying,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `);

    // Create hazards table
    await queryRunner.query(`
      CREATE TABLE "hazards" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" "hazard_type" NOT NULL DEFAULT 'nid_de_poule',
        "description" character varying NOT NULL,
        "latitude" numeric(10,7) NOT NULL,
        "longitude" numeric(10,7) NOT NULL,
        "address" character varying,
        "status" "hazard_status" NOT NULL DEFAULT 'active',
        "imageUrl" character varying,
        "userId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_hazards_id" PRIMARY KEY ("id")
      )
    `);

    // Create foreign key
    await queryRunner.query(`
      ALTER TABLE "hazards" 
      ADD CONSTRAINT "FK_hazards_userId" 
      FOREIGN KEY ("userId") 
      REFERENCES "users"("id") 
      ON DELETE CASCADE 
      ON UPDATE NO ACTION
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_hazards_userId" ON "hazards" ("userId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_hazards_status" ON "hazards" ("status")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_hazards_type" ON "hazards" ("type")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_users_email" ON "users" ("email")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_users_email"`);
    await queryRunner.query(`DROP INDEX "IDX_hazards_type"`);
    await queryRunner.query(`DROP INDEX "IDX_hazards_status"`);
    await queryRunner.query(`DROP INDEX "IDX_hazards_userId"`);

    // Drop foreign key
    await queryRunner.query(`ALTER TABLE "hazards" DROP CONSTRAINT "FK_hazards_userId"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "hazards"`);
    await queryRunner.query(`DROP TABLE "users"`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE "hazard_status"`);
    await queryRunner.query(`DROP TYPE "hazard_type"`);
  }
}
