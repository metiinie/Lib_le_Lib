import { AppDataSource } from '../src/config/typeorm.config';

async function check() {
    await AppDataSource.initialize();
    const dbInfo = await AppDataSource.query('SELECT current_database(), current_user, inet_server_port();');
    console.log('--- CONNECTED DB INFO ---', dbInfo);
    const cols = await AppDataSource.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users';");
    console.log('--- USERS TABLE COLUMNS ---', cols.map((c: any) => c.column_name));
    await AppDataSource.destroy();
}

check().catch(err => {
    console.error('ERROR:', err);
    process.exit(1);
});
