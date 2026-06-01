import pg from 'pg';
const { Client } = pg;

const EMAIL = process.argv[2];
const AMOUNT = parseInt(process.argv[3] ?? '0', 10);

if (!EMAIL || !AMOUNT) {
  console.error('Usage: node grant-credits.mjs <email> <amount>');
  process.exit(1);
}

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  const userR = await client.query('SELECT id, email FROM users WHERE email = $1', [EMAIL]);
  if (userR.rows.length === 0) {
    console.error('User not found:', EMAIL);
    process.exit(2);
  }
  const userId = userR.rows[0].id;

  await client.query('BEGIN');
  // Ensure user_credits row exists
  await client.query(
    `INSERT INTO user_credits (user_id, balance) VALUES ($1, 0) ON CONFLICT (user_id) DO NOTHING`,
    [userId]
  );
  const updated = await client.query(
    `UPDATE user_credits SET balance = balance + $2, total_bought = total_bought + $2, updated_at = NOW() WHERE user_id = $1 RETURNING balance`,
    [userId, AMOUNT]
  );
  await client.query('COMMIT');
  console.log(`Granted ${AMOUNT} credits to ${EMAIL} (user ${userId}). New balance: ${updated.rows[0].balance}`);
} catch (e) {
  await client.query('ROLLBACK');
  console.error('Failed:', e.message);
  process.exit(1);
} finally {
  await client.end();
}
