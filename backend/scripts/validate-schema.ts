import { AppDataSource } from '../src/config/typeorm.config';
import * as fs from 'fs';

async function validateAllEntities() {
    await AppDataSource.initialize();
    const metadata = AppDataSource.entityMetadatas;
    const missing: string[] = [];

    for (const entity of metadata) {
        const tableName = entity.tableName;
        const schema = entity.schema || 'public';

        const dbColsRes = await AppDataSource.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = $1 AND table_name = $2;
    `, [schema, tableName]);

        const dbCols = new Set(dbColsRes.map((c: any) => c.column_name));

        for (const column of entity.columns) {
            const colName = column.databaseName;
            if (!dbCols.has(colName)) {
                missing.push(`Entity '${entity.name}' (Table '${schema}.${tableName}') Column '${colName}'`);
            }
        }
    }

    fs.writeFileSync('schema-report.txt', missing.join('\n'));
    console.log(`REPORT SAVED. TOTAL MISSING: ${missing.length}`);
    await AppDataSource.destroy();
}

validateAllEntities().catch(err => {
    console.error('Validation script failed:', err);
    process.exit(1);
});
