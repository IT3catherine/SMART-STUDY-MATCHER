const { Client } = require('pg');
const client = new Client({ connectionString: 'postgres://postgres:postgres@localhost:5432/studymatcher' });

async function run() {
  await client.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id uuid PRIMARY KEY,
        match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
        sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        text text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    console.log('Messages table verified.');
  } catch (e) {
    console.error('Table creation error:', e.message);
  } finally {
    await client.end();
  }
}

run();
