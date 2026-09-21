const { Client } = require('pg');
const client = new Client({ connectionString: 'postgres://postgres:postgres@localhost:5432/studymatcher' });

async function run() {
  await client.connect();
  try {
    await client.query(`
      UPDATE notifications n
      SET payload = payload || jsonb_build_object(
        'from_user_name', u.name,
        'unit_name', un.name,
        'unit_code', un.code
      )
      FROM match_requests mr
      JOIN users u ON u.id = mr.from_user_id
      JOIN units un ON un.id = mr.unit_id
      WHERE n.type = 'REQUEST_RECEIVED'
        AND (n.payload->>'request_id')::uuid = mr.id
        AND n.payload->>'from_user_name' IS NULL;
    `);
    
    await client.query(`
      UPDATE notifications n
      SET payload = payload || jsonb_build_object(
        'by_user_name', u.name,
        'unit_name', un.name,
        'unit_code', un.code
      )
      FROM match_requests mr
      JOIN users u ON u.id = mr.to_user_id
      JOIN units un ON un.id = mr.unit_id
      WHERE n.type = 'REQUEST_ACCEPTED'
        AND (n.payload->>'request_id')::uuid = mr.id
        AND n.payload->>'by_user_name' IS NULL;
    `);

    console.log('Successfully patched notifications');
  } catch (e) {
    console.error('Migration error:', e.message);
  } finally {
    await client.end();
  }
}

run();
