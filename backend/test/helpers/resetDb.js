import { db } from '../../src/db/index.js';

export function resetDb() {
  db.exec('DELETE FROM hand_results');
  db.exec('DELETE FROM hands');
  db.exec('DELETE FROM game_players');
  db.exec('DELETE FROM games');
  db.exec('DELETE FROM players');
  try {
    db.exec('DELETE FROM sqlite_sequence');
  } catch {
    // sqlite_sequence only exists once an AUTOINCREMENT insert has happened
  }
}
