import { query } from '../db/index.js';

export async function createPlayer(name) {
  const { rows } = await query('INSERT INTO players (name) VALUES ($1) RETURNING id', [name]);
  return getPlayerById(rows[0].id);
}

export async function getAllPlayers() {
  const { rows } = await query('SELECT * FROM players ORDER BY name ASC');
  return rows;
}

export async function getPlayerById(id) {
  const { rows } = await query('SELECT * FROM players WHERE id = $1', [id]);
  return rows[0];
}

export async function getPlayerByName(name) {
  const { rows } = await query('SELECT * FROM players WHERE name = $1', [name]);
  return rows[0];
}

export async function getGameCountForPlayer(id) {
  const { rows } = await query('SELECT COUNT(*)::int AS cnt FROM game_players WHERE player_id = $1', [id]);
  return rows[0].cnt;
}

export async function deletePlayer(id) {
  await query('DELETE FROM players WHERE id = $1', [id]);
}
