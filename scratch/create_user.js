const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const databaseUrl = "postgresql://admin:kianlok666@158.220.123.36/careeros";

async function run() {
  const pool = new Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 5000,
  });

  try {
    const email = 'demo_skip_user@example.com'.toLowerCase();
    const name = 'Demo User';
    const password = 'password123';

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // Clean up existing user if any
    await pool.query('DELETE FROM users WHERE email = $1', [email]);
    console.log(`Deleted existing user with email: ${email}`);

    // Insert user
    const insertRes = await pool.query(
      'INSERT INTO users (name, email, password_hash, target_role) VALUES ($1, $2, $3, $4) RETURNING id, name, email',
      [name, email, hash, 'PENDING_ONBOARDING']
    );

    console.log('Successfully created test user:', insertRes.rows[0]);
  } catch (err) {
    console.error('Error creating user:', err);
  } finally {
    await pool.end();
  }
}

run();
