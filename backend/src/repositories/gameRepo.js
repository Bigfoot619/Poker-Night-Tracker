import { db } from '../db/index.js';

export function createGame(date, chipsAmount, cashAmountCents) {
  const stmt = db.prepare('INSERT INTO games (date, chips_amount, cash_amount_cents) VALUES (?, ?, ?)');
  const info = stmt.run(date, chipsAmount, cashAmountCents);
  return getGameById(Number(info.lastInsertRowid));
}

export function addGamePlayer(gameId, playerId) {
  db.prepare('INSERT INTO game_players (game_id, player_id) VALUES (?, ?)').run(gameId, playerId);
}

export function getGameById(id) {
  return db.prepare('SELECT * FROM games WHERE id = ?').get(id);
}

export function getActiveGame() {
  return db.prepare("SELECT * FROM games WHERE status = 'in_progress' ORDER BY created_at DESC LIMIT 1").get();
}

export function getAllGames() {
  return db.prepare('SELECT * FROM games ORDER BY date DESC, id DESC').all();
}

export function getGamePlayers(gameId) {
  return db.prepare(
    `SELECT p.* FROM players p
     JOIN game_players gp ON gp.player_id = p.id
     WHERE gp.game_id = ?
     ORDER BY p.name ASC`
  ).all(gameId);
}

export function finishGame(gameId) {
  db.prepare("UPDATE games SET status = 'finished', finished_at = datetime('now') WHERE id = ?").run(gameId);
  return getGameById(gameId);
}
