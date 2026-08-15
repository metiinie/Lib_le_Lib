import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPremiumLogic1786060000000 implements MigrationInterface {
  name = 'AddPremiumLogic1786060000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS dm_credits (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        balance     SMALLINT NOT NULL DEFAULT 0,
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS dm_requests (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sender_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        recipient_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        first_message   TEXT NOT NULL,
        status          TEXT NOT NULL DEFAULT 'pending',
        expires_at      TIMESTAMPTZ NOT NULL,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (sender_id, recipient_id)
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS dm_requests`);
    await queryRunner.query(`DROP TABLE IF EXISTS dm_credits`);
  }
}
