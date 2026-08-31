import * as gameRepo from '../repositories/gameRepo.js';
import * as handRepo from '../repositories/handRepo.js';
import * as playerRepo from '../repositories/playerRepo.js';
import { transaction } from '../db/index.js';
import { badRequest, notFound, conflict } from '../errors.js';

async function computeTotalsForGame(gameId) {
  const results = await handRepo.getResultsForGame(gameId);
  const totals = new Map();
  for (const r of results) {
    totals.set(r.player_id, (totals.get(r.player_id) ?? 0) + r.amount);
  }
  return totals;
}

async function toGameSummary(game) {
  const players = await gameRepo.getGamePlayers(game.id);
  const handCount = await handRepo.countHandsForGame(game.id);
  const totals = await computeTotalsForGame(game.id);
  return {
    ...game,
    players,
    handCount,
    totals: players.map((p) => ({ playerId: p.id, name: p.name, amount: totals.get(p.id) ?? 0 })),
  };
}

export async function listGames() {
  const games = await gameRepo.getAllGames();
  return Promise.all(games.map(toGameSummary));
}

export async function getGame(id) {
  const game = await gameRepo.getGameById(id);
  if (!game) throw notFound('Game not found.');
  return toGameSummary(game);
}

export async function getGameWithHands(id) {
  const summary = await getGame(id);
  const rawHands = await handRepo.getHandsForGame(id);
  const hands = await Promise.all(
    rawHands.map(async (h) => ({
      id: h.id,
      handNumber: h.hand_number,
      variant: h.variant,
      createdAt: h.created_at,
      updatedAt: h.updated_at,
      results: (await handRepo.getResultsForHand(h.id)).map((r) => ({ playerId: r.player_id, amount: r.amount })),
    }))
  );
  return { ...summary, hands };
}

export async function getActiveGame() {
  const game = await gameRepo.getActiveGame();
  return game ? toGameSummary(game) : null;
}

export async function createGame(date, playerIds, chipsAmount, cashAmountCents) {
  if (!date) throw badRequest('Date is required.');
  if (!Array.isArray(playerIds) || playerIds.length < 2) {
    throw badRequest('At least two players are required to start a game.');
  }
  for (const id of playerIds) {
    if (!(await playerRepo.getPlayerById(id))) throw badRequest(`Player ${id} does not exist.`);
  }
  if (!Number.isInteger(chipsAmount) || chipsAmount <= 0) {
    throw badRequest('Chips amount must be a positive whole number.');
  }
  if (!Number.isInteger(cashAmountCents) || cashAmountCents <= 0) {
    throw badRequest('Cash amount must be a positive number.');
  }
  if (await gameRepo.getActiveGame()) {
    throw conflict('A game is already in progress. Finish it before starting a new one.');
  }

  return transaction(async () => {
    const game = await gameRepo.createGame(date, chipsAmount, cashAmountCents);
    for (const playerId of playerIds) {
      await gameRepo.addGamePlayer(game.id, playerId);
    }
    return toGameSummary(game);
  });
}

function assertInProgress(game) {
  if (game.status !== 'in_progress') {
    throw conflict('This game is finished. Reopen it explicitly to make changes.');
  }
}

export async function endGame(id) {
  const game = await gameRepo.getGameById(id);
  if (!game) throw notFound('Game not found.');
  assertInProgress(game);
  await gameRepo.finishGame(id);
  return getGame(id);
}
