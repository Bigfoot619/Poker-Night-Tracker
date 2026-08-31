import { db } from '../db/index.js';

export function getFinishedHandRecordsForPlayer(playerId) {
  return db.prepare(
    `SELECT hr.amount AS amount, h.hand_number AS handNumber, h.variant AS variant,
            h.game_id AS gameId, g.date AS date
     FROM hand_results hr
     JOIN hands h ON h.id = hr.hand_id
     JOIN games g ON g.id = h.game_id
     WHERE hr.player_id = ? AND g.status = 'finished'`
  ).all(playerId);
}

export function getAllPlayerIdsWithFinishedGames() {
  const rows = db.prepare(
    `SELECT DISTINCT gp.player_id AS playerId
     FROM game_players gp
     JOIN games g ON g.id = gp.game_id
     WHERE g.status = 'finished'`
  ).all();
  return rows.map((r) => r.playerId);
}
