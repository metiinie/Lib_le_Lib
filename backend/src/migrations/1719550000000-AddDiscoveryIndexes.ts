import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDiscoveryIndexes1719550000000 implements MigrationInterface {
  name = 'AddDiscoveryIndexes1719550000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Core discovery feed performance indexes
    await queryRunner.query(
      `CREATE INDEX "idx_users_status_created_at" ON "users" ("status", "created_at" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_profiles_region_id" ON "profiles" ("region_id")`,
    );

    // Fast primary photo join
    await queryRunner.query(
      `CREATE INDEX "idx_photos_profile_id_primary" ON "photos" ("profile_id") WHERE is_primary = true`,
    );

    // Safety / Blocks exclusion lookup performance
    await queryRunner.query(
      `CREATE INDEX "idx_blocks_blocked_id" ON "blocks" ("blocked_id")`,
    );

    // Matches exclusion lookup performance
    await queryRunner.query(
      `CREATE INDEX "idx_matches_user_a_id" ON "matches" ("user_a_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_matches_user_b_id" ON "matches" ("user_b_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_matches_user_b_id"`);
    await queryRunner.query(`DROP INDEX "idx_matches_user_a_id"`);
    await queryRunner.query(`DROP INDEX "idx_blocks_blocked_id"`);
    await queryRunner.query(`DROP INDEX "idx_photos_profile_id_primary"`);
    await queryRunner.query(`DROP INDEX "idx_profiles_region_id"`);
    await queryRunner.query(`DROP INDEX "idx_users_status_created_at"`);
  }
}
