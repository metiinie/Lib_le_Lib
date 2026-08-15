import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProfileFields1786050976324 implements MigrationInterface {
    name = 'AddProfileFields1786050976324'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."profiles_looking_for_enum" AS ENUM('men', 'women', 'everyone')`);
        await queryRunner.query(`ALTER TABLE "profiles" ADD "looking_for" "public"."profiles_looking_for_enum" array NOT NULL DEFAULT '{everyone}'`);
        await queryRunner.query(`ALTER TABLE "profiles" ADD "virus_type" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN "virus_type"`);
        await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN "looking_for"`);
        await queryRunner.query(`DROP TYPE "public"."profiles_looking_for_enum"`);
    }
}
