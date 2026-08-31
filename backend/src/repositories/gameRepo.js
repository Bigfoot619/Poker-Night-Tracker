import { query } from '../db/index.js';

export async function createGame(date, chipsAmount, cashAmountCents) {
  const { rows } = await query(
    'INSERT INTO games (date, chips_amount, cash_amount_cents) VALUES ($1, $2, $3) RETURNING id',
    [date, chipsAmount, cashAmountCents]
  );
  return getGameById(rows[0].id);
}

export async function addGamePlayer(gameId, playerId) {
  await query('INSERT INTO game_players (game_id, player_id) VALUES ($1, $2)', [gameId, playerId]);
}

export async function getGameById(id) {
  const { rows } = await query('SELECT * FROM games WHERE id = $1', [id]);
  return rows[0];
}

export async function getActiveGame() {
  const { rows } = await query(
    "SELECT * FROM games WHERE status = 'in_progress' ORDER BY created_at DESC LIMIT 1"
  );
  return rows[0];
}

export async function getAllGames() {
  const { rows } = await query('SELECT * FROM games ORDER BY date DESC, id DESC');
  return rows;
}

export async function getGamePlayers(gameId) {
  const { rows } = await query(
    `SELECT p.* FROM players p
     JOIN game_players gp ON gp.player_id = p.id
     WHERE gp.game_id = $1
     ORDER BY p.name ASC`,
    [gameId]
  );
  return rows;
}

export async function finishGame(gameId) {
  await query("UPDATE games SET status = 'finished', finished_at = now() WHERE id = $1", [gameId]);
  return getGameById(gameId);
}
