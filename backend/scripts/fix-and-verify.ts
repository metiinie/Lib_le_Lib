import { AppDataSource } from '../src/config/typeorm.config';

async function runFixAndVerify() {
    await AppDataSource.initialize();
    console.log('--- EXECUTING DDL FIXES ---');

    await AppDataSource.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "apple_id" text UNIQUE;`);
    await AppDataSource.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "google_id" text UNIQUE;`);
    await AppDataSource.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone_verified_at" timestamptz;`);
    await AppDataSource.query(`ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "full_name" text;`);

    console.log('--- VERIFYING COLUMNS IN INFORMATION_SCHEMA ---');

    const userCols = await AppDataSource.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'users';`
    );
    const userColNames = userCols.map((c: any) => c.column_name);

    const profileCols = await AppDataSource.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles';`
    );
    const profileColNames = profileCols.map((c: any) => c.column_name);

    console.log('Users columns:', userColNames);
    console.log('Profiles columns:', profileColNames);

    const hasAppleId = userColNames.includes('apple_id');
    const hasGoogleId = userColNames.includes('google_id');
    const hasPhoneVerifiedAt = userColNames.includes('phone_verified_at');
    const hasFullName = profileColNames.includes('full_name');

    if (hasAppleId && hasGoogleId && hasPhoneVerifiedAt && hasFullName) {
        console.log('SUCCESS! ALL COLUMNS ARE PRESENT IN THE POSTGRES DATABASE!');
    } else {
        console.error('FAILED! MISSING COLUMNS:', { hasAppleId, hasGoogleId, hasPhoneVerifiedAt, hasFullName });
    }

    await AppDataSource.destroy();
}

runFixAndVerify().catch(err => {
    console.error('ERROR:', err);
    process.exit(1);
});
