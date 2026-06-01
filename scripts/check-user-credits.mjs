import pg from 'pg';
const { Client } = pg;
const EMAIL = process.argv[2];

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  const u = await client.query('SELECT id, email, name FROM users WHERE email = $1', [EMAIL]);
  console.log('Users matching email:', u.rows);
  for (const row of u.rows) {
    const c = await client.query('SELECT balance, updated_at FROM user_credits WHERE user_id = $1', [row.id]);
    console.log(`  user_id=${row.id} credits=`, c.rows);
  }
  // also: maybe duplicate by case
  const all = await client.query(`SELECT id, email FROM users WHERE LOWER(email) = LOWER($1)`, [EMAIL]);
  console.log('Case-insensitive matches:', all.rows);
} finally {
  await client.end();
}
