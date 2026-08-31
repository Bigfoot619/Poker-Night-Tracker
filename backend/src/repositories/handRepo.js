import { db } from '../db/index.js';

export function getMaxHandNumber(gameId) {
  const row = db.prepare('SELECT MAX(hand_number) AS maxNum FROM hands WHERE game_id = ?').get(gameId);
  return row.maxNum ?? 0;
}

export function insertHand(gameId, handNumber, variant) {
  const info = db
    .prepare('INSERT INTO hands (game_id, hand_number, variant) VALUES (?, ?, ?)')
    .run(gameId, handNumber, variant);
  return Number(info.lastInsertRowid);
}

export function setHandVariant(handId, variant) {
  db.prepare('UPDATE hands SET variant = ? WHERE id = ?').run(variant, handId);
}

export function insertHandResult(handId, playerId, amount) {
  db.prepare('INSERT INTO hand_results (hand_id, player_id, amount) VALUES (?, ?, ?)').run(handId, playerId, amount);
}

export function getHandById(handId) {
  return db.prepare('SELECT * FROM hands WHERE id = ?').get(handId);
}

export function getLastHand(gameId) {
  return db.prepare('SELECT * FROM hands WHERE game_id = ? ORDER BY hand_number DESC LIMIT 1').get(gameId);
}

export function getHandsForGame(gameId) {
  return db.prepare('SELECT * FROM hands WHERE game_id = ? ORDER BY hand_number ASC').all(gameId);
}

export function getResultsForHand(handId) {
  return db.prepare('SELECT * FROM hand_results WHERE hand_id = ?').all(handId);
}

export function getResultsForGame(gameId) {
  return db.prepare(
    `SELECT hr.* FROM hand_results hr
     JOIN hands h ON h.id = hr.hand_id
     WHERE h.game_id = ?`
  ).all(gameId);
}

export function deleteHand(handId) {
  db.prepare('DELETE FROM hands WHERE id = ?').run(handId);
}

export function clearHandResults(handId) {
  db.prepare('DELETE FROM hand_results WHERE hand_id = ?').run(handId);
}

export function touchHand(handId) {
  db.prepare("UPDATE hands SET updated_at = datetime('now') WHERE id = ?").run(handId);
}

export function countHandsForGame(gameId) {
  const row = db.prepare('SELECT COUNT(*) AS cnt FROM hands WHERE game_id = ?').get(gameId);
  return row.cnt;
}
