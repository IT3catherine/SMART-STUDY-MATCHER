const { Client } = require('pg');
const client = new Client({ connectionString: 'postgres://postgres:postgres@localhost:5432/studymatcher' });

async function run() {
  await client.connect();
  try {
    const res = await client.query(`
      DELETE FROM matches m1
      USING matches m2
      WHERE m1.id > m2.id
        AND ((m1.user1_id = m2.user1_id AND m1.user2_id = m2.user2_id)
             OR (m1.user1_id = m2.user2_id AND m1.user2_id = m2.user1_id))
        AND m1.unit_id = m2.unit_id;
    `);
    console.log('Deduped', res.rowCount, 'duplicate matches');

    await client.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT false;`);
    console.log('Added is_read column to messages.');
  } catch (e) {
    console.error(e.message);
  } finally {
    await client.end();
  }
}

run();
