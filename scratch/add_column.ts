import { query } from '../lib/db';

async function main() {
  try {
    console.log("Adding is_premium column to users table...");
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_premium BOOLEAN NOT NULL DEFAULT FALSE;`);
    console.log("Successfully added column!");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

main();
