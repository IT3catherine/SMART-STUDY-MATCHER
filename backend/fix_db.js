const { Client } = require('pg');
const client = new Client({ connectionString: 'postgres://postgres:postgres@localhost:5432/studymatcher' });

async function run() {
  await client.connect();
  try {
    await client.query('ALTER TABLE matches ADD COLUMN IF NOT EXISTS unit_id uuid REFERENCES units(id) ON DELETE CASCADE');
    console.log('Successfully added unit_id to matches table');
  } catch (e) {
    console.error('Migration error:', e.message);
  } finally {
    await client.end();
  }
}

run();
