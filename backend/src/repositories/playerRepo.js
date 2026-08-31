import { db } from '../db/index.js';

export function createPlayer(name) {
  const stmt = db.prepare('INSERT INTO players (name) VALUES (?)');
  const info = stmt.run(name);
  return getPlayerById(Number(info.lastInsertRowid));
}

export function getAllPlayers() {
  return db.prepare('SELECT * FROM players ORDER BY name ASC').all();
}

export function getPlayerById(id) {
  return db.prepare('SELECT * FROM players WHERE id = ?').get(id);
}

export function getPlayerByName(name) {
  return db.prepare('SELECT * FROM players WHERE name = ?').get(name);
}

export function getGameCountForPlayer(id) {
  const row = db.prepare('SELECT COUNT(*) AS cnt FROM game_players WHERE player_id = ?').get(id);
  return row.cnt;
}

export function deletePlayer(id) {
  db.prepare('DELETE FROM players WHERE id = ?').run(id);
}
