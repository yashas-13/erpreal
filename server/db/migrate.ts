
import 'dotenv/config';
import { pool } from './index.js';
import fs from 'fs';
import path from 'path';

async function migrate() {
  let client;

  try {
    client = await pool.connect();

    console.log('Running database migrations...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const migrationsDir = path.join(
  process.cwd(),
  'server',
  'db',
  'migrations'
);

    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const result = await client.query(
        'SELECT 1 FROM schema_migrations WHERE filename = $1',
        [file]
      );

      if (result.rowCount && result.rowCount > 0) {
        console.log(`Skipping ${file} - already applied`);
        continue;
      }

      const sql = fs.readFileSync(
        path.join(migrationsDir, file),
        'utf8'
      );

      await client.query('BEGIN');

      try {
        await client.query(sql);

        await client.query(
          'INSERT INTO schema_migrations (filename) VALUES ($1)',
          [file]
        );

        await client.query('COMMIT');
        console.log(`Applied: ${file}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
console.log('All migrations completed successfully.');

} catch (error) {
  console.error('Migration failed:', error);
  process.exitCode = 1;
} finally {
  client?.release();
  await pool.end();
}
}

migrate();