import { query } from '../db/index.js';

export async function getFinishedHandRecordsForPlayer(playerId) {
  const { rows } = await query(
    `SELECT hr.amount AS amount, h.hand_number AS "handNumber", h.variant AS variant,
            h.game_id AS "gameId", g.date AS date
     FROM hand_results hr
     JOIN hands h ON h.id = hr.hand_id
     JOIN games g ON g.id = h.game_id
     WHERE hr.player_id = $1 AND g.status = 'finished'`,
    [playerId]
  );
  return rows;
}

export async function getAllPlayerIdsWithFinishedGames() {
  const { rows } = await query(
    `SELECT DISTINCT gp.player_id AS "playerId"
     FROM game_players gp
     JOIN games g ON g.id = gp.game_id
     WHERE g.status = 'finished'`
  );
  return rows.map((r) => r.playerId);
}
