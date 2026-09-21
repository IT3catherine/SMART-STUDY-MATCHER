const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://admin:admin123@localhost:5434/stud_db'
});

async function migrate() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS login_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        ip_address VARCHAR(255),
        user_agent TEXT,
        device_fingerprint VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_code VARCHAR(10);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_expires_at TIMESTAMP;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER DEFAULT 1;
    `);
    console.log("V10 Security Migration Completed Seamlessly.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

migrate();
