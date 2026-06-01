import pg from 'pg';
const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  const r = await client.query('SELECT * FROM __drizzle_migrations ORDER BY id');
  console.log('Applied migrations:');
  r.rows.forEach(row => console.log(' -', row.hash?.slice(0,16), new Date(Number(row.created_at)).toISOString()));
} catch (e) { console.log('No __drizzle_migrations table:', e.message); }
const cols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'generations' ORDER BY column_name");
console.log('\nColumns in generations:');
cols.rows.forEach(r => console.log(' -', r.column_name));
const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('model_presets','model_overrides','notifications')");
console.log('\nNew tables present:');
tables.rows.forEach(r => console.log(' -', r.table_name));
await client.end();
