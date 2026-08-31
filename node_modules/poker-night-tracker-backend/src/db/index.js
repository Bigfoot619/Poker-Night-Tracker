import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdirSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', '..', 'data', 'poker.db');
if (dbPath !== ':memory:') {
  mkdirSync(path.dirname(dbPath), { recursive: true });
}

export const db = new DatabaseSync(dbPath);

db.exec('PRAGMA foreign_keys = ON;');

function runMigrations() {
  db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT (datetime(\'now\')))');

  const migrationsDir = path.join(__dirname, 'migrations');
  const files = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
  const applied = new Set(db.prepare('SELECT name FROM schema_migrations').all().map((r) => r.name));

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = readFileSync(path.join(migrationsDir, file), 'utf8');
    db.exec(sql);
    db.prepare('INSERT INTO schema_migrations (name) VALUES (?)').run(file);
  }
}

runMigrations();

export function transaction(fn) {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}
