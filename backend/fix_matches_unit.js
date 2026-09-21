const { Client } = require('pg');
const client = new Client({ connectionString: 'postgres://postgres:postgres@localhost:5432/studymatcher' });

async function run() {
  await client.connect();
  try {
    const res = await client.query(`
      UPDATE matches m
      SET unit_id = mr.unit_id
      FROM match_requests mr
      WHERE m.unit_id IS NULL
        AND ((m.user1_id = mr.from_user_id AND m.user2_id = mr.to_user_id)
             OR (m.user1_id = mr.to_user_id AND m.user2_id = mr.from_user_id))
        AND mr.status = 'ACCEPTED';
    `);
    console.log('Retroactively patched', res.rowCount, 'matches with their originating unit_id.');
  } catch (e) {
    console.error('Match patching error:', e.message);
  } finally {
    await client.end();
  }
}

run();
