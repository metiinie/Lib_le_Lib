import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSsoAndPhoneVerifiedColumns1786080000000 implements MigrationInterface {
    name = 'AddSsoAndPhoneVerifiedColumns1786080000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "apple_id" text UNIQUE`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "google_id" text UNIQUE`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone_verified_at" timestamptz`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "phone_verified_at"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "google_id"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "apple_id"`);
    }
}
