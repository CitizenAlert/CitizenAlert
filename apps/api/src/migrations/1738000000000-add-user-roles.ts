import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddUserRoles1738000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type if it doesn't exist
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "user_role_enum" AS ENUM('citizen', 'municipality', 'admin');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Add role column with default value
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'role',
        type: 'enum',
        enum: ['citizen', 'municipality', 'admin'],
        default: "'citizen'",
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove role column
    await queryRunner.dropColumn('users', 'role');

    // Drop enum type (only if no other tables use it)
    await queryRunner.query(`DROP TYPE IF EXISTS "user_role_enum"`);
  }
}
