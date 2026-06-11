import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL;

// Identify if database is using placeholder configuration
const isPlaceholder = !databaseUrl || databaseUrl.includes('your_contabo_vps_ip');

let pool: Pool | null = null;

if (!isPlaceholder && databaseUrl) {
  // Parse connection details
  pool = new Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 4000, // Fail fast if VPS is unreachable
    max: 10, // Max connection pool size
    idleTimeoutMillis: 30000
  });
}

/**
 * Execute a query on the PostgreSQL connection pool.
 */
export async function query(text: string, params?: any[]) {
  if (isPlaceholder || !pool) {
    throw new Error('POSTGRESQL_OFFLINE: Connection string contains placeholder or is undefined.');
  }
  return pool.query(text, params);
}

/**
 * Check if the PostgreSQL database is reachable.
 */
export async function checkDatabaseConnection(): Promise<{ online: boolean; message: string }> {
  if (isPlaceholder || !pool) {
    return { 
      online: false, 
      message: 'PostgreSQL connection URL in .env.local needs configuration with your Contabo VPS details.' 
    };
  }
  try {
    const client = await pool.connect();
    // Verify that the users table exists, or try to run init SQL if missing
    try {
      await client.query('SELECT 1 FROM users LIMIT 1');
    } catch (tblError) {
      // Table doesn't exist, let's create it automatically
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          target_role VARCHAR(255) NOT NULL DEFAULT 'PENDING_ONBOARDING',
          reset_token VARCHAR(255),
          reset_token_expiry TIMESTAMP,
          market_analysis TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }

    // Run migrations to ensure columns exist on existing databases
    try {
      await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS market_analysis TEXT');
    } catch (migError) {
      console.error('Migration error on users (market_analysis):', migError);
    }

    // Verify milestones table exists
    try {
      await client.query('SELECT 1 FROM milestones LIMIT 1');
    } catch (tblError) {
      await client.query(`
        CREATE TABLE IF NOT EXISTS milestones (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          role VARCHAR(255) NOT NULL,
          organization VARCHAR(255) NOT NULL,
          type VARCHAR(50) NOT NULL,
          start_date VARCHAR(50) NOT NULL,
          end_date VARCHAR(50) NOT NULL,
          description TEXT,
          skills JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }

    // Verify profile_versions table exists
    try {
      await client.query('SELECT 1 FROM profile_versions LIMIT 1');
    } catch (tblError) {
      await client.query(`
        CREATE TABLE IF NOT EXISTS profile_versions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          version_number INTEGER NOT NULL,
          resume_filename VARCHAR(255) NOT NULL,
          target_role VARCHAR(255) NOT NULL,
          milestones JSONB NOT NULL,
          market_analysis TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }

    // Run migrations for profile_versions
    try {
      await client.query('ALTER TABLE profile_versions ADD COLUMN IF NOT EXISTS market_analysis TEXT');
    } catch (migError) {
      console.error('Migration error on profile_versions (market_analysis):', migError);
    }
    client.release();
    return { online: true, message: 'Successfully connected to VPS PostgreSQL instance.' };
  } catch (error: any) {
    return { 
      online: false, 
      message: `Could not connect to PostgreSQL: ${error.message}` 
    };
  }
}
