import pg from 'pg';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { AsyncLocalStorage } from 'node:async_hooks';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required (e.g. a Postgres connection string from Neon).');
}

const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);

export const pool = new Pool({
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

const txStorage = new AsyncLocalStorage();

// Every repo query goes through here. Inside transaction(), it transparently
// uses the checked-out client so nested repo calls share one transaction
// without needing a client threaded through every function signature.
export async function query(text, params) {
  const client = txStorage.getStore();
  if (client) return client.query(text, params);
  return pool.query(text, params);
}

export async function transaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await txStorage.run(client, fn);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

const MIGRATION_LOCK_KEY = 727627;

async function runMigrations() {
  const client = await pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock($1)', [MIGRATION_LOCK_KEY]);

    await client.query(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`
    );

    const migrationsDir = path.join(__dirname, 'migrations');
    const files = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
    const { rows } = await client.query('SELECT name FROM schema_migrations');
    const applied = new Set(rows.map((r) => r.name));

    for (const file of files) {
      if (applied.has(file)) continue;
      const sql = readFileSync(path.join(migrationsDir, file), 'utf8');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
    }
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [MIGRATION_LOCK_KEY]);
    client.release();
  }
}

// Kicked off once per process/cold-start. Callers await this before serving
// the first request; it resolves instantly on every request after that.
export const migrationsReady = runMigrations();
