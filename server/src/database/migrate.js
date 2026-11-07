import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, initDb } from './db.js';
import { seedDatabase } from './seed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
  await initDb();
  console.log(' Running database migrations...');

  if (db.isPostgres()) {
    try {
      const sqlPath = path.resolve(__dirname, 'schema.sql');
      const sql = fs.readFileSync(sqlPath, 'utf-8');
      await db.query(sql);
      console.log(' PostgreSQL schema applied successfully.');
    } catch (err) {
      console.error(' Migration failed for PostgreSQL:', err.message);
      throw err;
    }
  } else {
    console.log(' Local database initialized.');
  }

  // Check if database needs seeding
  const userCount = await db.count('users');
  if (userCount === 0) {
    console.log('🌱 No users found, triggering automatic seed...');
    await seedDatabase();
  }
}

if (process.argv[1] && process.argv[1].endsWith('migrate.js')) {
  runMigrations().then(() => {
    console.log(' Migrations completed.');
    process.exit(0);
  }).catch(err => {
    console.error('Migration error:', err);
    process.exit(1);
  });
}
