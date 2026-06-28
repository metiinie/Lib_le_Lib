const { Client } = require('pg');
require('dotenv').config();

async function verify() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database to verify schema...\n');

    // 1. Check schemas
    const schemasRes = await client.query(`
      SELECT schema_name FROM information_schema.schemata 
      WHERE schema_name IN ('public', 'verification');
    `);
    console.log('--- Schemas ---');
    schemasRes.rows.forEach(r => console.log(`Schema: ${r.schema_name}`));
    console.log();

    // 2. Check enums
    const enumsRes = await client.query(`
      SELECT t.typname as name, 
             string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as values
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      GROUP BY t.typname;
    `);
    console.log('--- Enums ---');
    enumsRes.rows.forEach(r => console.log(`Enum [${r.name}]: (${r.values})`));
    console.log();

    // 3. Check public tables
    const publicTablesRes = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    console.log('--- Public Tables ---');
    publicTablesRes.rows.forEach(r => console.log(`Table: public.${r.table_name}`));
    console.log();

    // 4. Check verification tables
    const verificationTablesRes = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'verification' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    console.log('--- Verification Tables ---');
    verificationTablesRes.rows.forEach(r => console.log(`Table: verification.${r.table_name}`));
    console.log();

    // 5. Check triggers
    const triggersRes = await client.query(`
      SELECT trigger_name, event_manipulation, event_object_table
      FROM information_schema.triggers
      WHERE trigger_schema IN ('public', 'verification')
      ORDER BY trigger_name;
    `);
    console.log('--- Triggers ---');
    triggersRes.rows.forEach(r => console.log(`Trigger [${r.trigger_name}] on ${r.event_object_table} (${r.event_manipulation})`));
    console.log();

    console.log('Verification check completed successfully!');
  } catch (err) {
    console.error('Error during verification:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

verify();
