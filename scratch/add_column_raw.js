const { Client } = require('pg');
const fs = require('fs');

async function main() {
  const envFile = fs.readFileSync('.env.local', 'utf8');
  const dbUrlMatch = envFile.match(/^DATABASE_URL="(.*)"$/m) || envFile.match(/^DATABASE_URL=(.*)$/m);
  if (!dbUrlMatch) {
    console.error("No DATABASE_URL found in .env.local");
    process.exit(1);
  }
  
  const client = new Client({
    connectionString: dbUrlMatch[1].trim()
  });

  try {
    await client.connect();
    console.log("Connected to DB, adding column...");
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_premium BOOLEAN NOT NULL DEFAULT FALSE;`);
    console.log("Successfully added is_premium column!");
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
