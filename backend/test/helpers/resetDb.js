import { query, migrationsReady } from '../../src/db/index.js';

// Ensures the schema exists before any test in this process runs.
await migrationsReady;

export async function resetDb() {
  await query('TRUNCATE hand_results, hands, game_players, games, players RESTART IDENTITY CASCADE');
}
