import { query } from '../db/index.js';

export async function getMaxHandNumber(gameId) {
  const { rows } = await query(
    'SELECT COALESCE(MAX(hand_number), 0)::int AS "maxNum" FROM hands WHERE game_id = $1',
    [gameId]
  );
  return rows[0].maxNum;
}

export async function insertHand(gameId, handNumber, variant) {
  const { rows } = await query(
    'INSERT INTO hands (game_id, hand_number, variant) VALUES ($1, $2, $3) RETURNING id',
    [gameId, handNumber, variant]
  );
  return rows[0].id;
}

export async function setHandVariant(handId, variant) {
  await query('UPDATE hands SET variant = $1 WHERE id = $2', [variant, handId]);
}

export async function insertHandResult(handId, playerId, amount) {
  await query('INSERT INTO hand_results (hand_id, player_id, amount) VALUES ($1, $2, $3)', [handId, playerId, amount]);
}

export async function getHandById(handId) {
  const { rows } = await query('SELECT * FROM hands WHERE id = $1', [handId]);
  return rows[0];
}

export async function getLastHand(gameId) {
  const { rows } = await query(
    'SELECT * FROM hands WHERE game_id = $1 ORDER BY hand_number DESC LIMIT 1',
    [gameId]
  );
  return rows[0];
}

export async function getHandsForGame(gameId) {
  const { rows } = await query('SELECT * FROM hands WHERE game_id = $1 ORDER BY hand_number ASC', [gameId]);
  return rows;
}

export async function getResultsForHand(handId) {
  const { rows } = await query('SELECT * FROM hand_results WHERE hand_id = $1', [handId]);
  return rows;
}

export async function getResultsForGame(gameId) {
  const { rows } = await query(
    `SELECT hr.* FROM hand_results hr
     JOIN hands h ON h.id = hr.hand_id
     WHERE h.game_id = $1`,
    [gameId]
  );
  return rows;
}

export async function deleteHand(handId) {
  await query('DELETE FROM hands WHERE id = $1', [handId]);
}

export async function clearHandResults(handId) {
  await query('DELETE FROM hand_results WHERE hand_id = $1', [handId]);
}

export async function touchHand(handId) {
  await query('UPDATE hands SET updated_at = now() WHERE id = $1', [handId]);
}

export async function countHandsForGame(gameId) {
  const { rows } = await query('SELECT COUNT(*)::int AS cnt FROM hands WHERE game_id = $1', [gameId]);
  return rows[0].cnt;
}
