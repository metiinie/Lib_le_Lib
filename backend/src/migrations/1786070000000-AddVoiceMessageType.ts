import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVoiceMessageType1786070000000 implements MigrationInterface {
  name = 'AddVoiceMessageType1786070000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE message_type ADD VALUE IF NOT EXISTS 'voice'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Postgres doesn't easily support dropping an enum value.
    // If we absolutely must, we'd have to rename the type, create a new one, etc.
    // We will leave this empty as additive enum values are generally safe to leave.
  }
}
