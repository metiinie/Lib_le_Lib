import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds photos_visible_to_verified column to the profiles table.
 *
 * This column lets profile owners opt out of showing their photos
 * to verified members. Default is true (photos visible to verified users).
 */
export class AddPhotosVisibleToVerified1722560000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE profiles
      ADD COLUMN photos_visible_to_verified BOOLEAN NOT NULL DEFAULT true;
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN profiles.photos_visible_to_verified IS
        'When true, verified (active) members can see this user''s photos unblurred in discovery.';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE profiles
      DROP COLUMN IF EXISTS photos_visible_to_verified;
    `);
  }
}
