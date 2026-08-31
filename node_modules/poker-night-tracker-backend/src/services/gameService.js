import * as gameRepo from '../repositories/gameRepo.js';
import * as handRepo from '../repositories/handRepo.js';
import * as playerRepo from '../repositories/playerRepo.js';
import { transaction } from '../db/index.js';
import { badRequest, notFound, conflict } from '../errors.js';

function computeTotalsForGame(gameId) {
  const results = handRepo.getResultsForGame(gameId);
  const totals = new Map();
  for (const r of results) {
    totals.set(r.player_id, (totals.get(r.player_id) ?? 0) + r.amount);
  }
  return totals;
}

function toGameSummary(game) {
  const players = gameRepo.getGamePlayers(game.id);
  const handCount = handRepo.countHandsForGame(game.id);
  const totals = computeTotalsForGame(game.id);
  return {
    ...game,
    players,
    handCount,
    totals: players.map((p) => ({ playerId: p.id, name: p.name, amount: totals.get(p.id) ?? 0 })),
  };
}

export function listGames() {
  return gameRepo.getAllGames().map(toGameSummary);
}

export function getGame(id) {
  const game = gameRepo.getGameById(id);
  if (!game) throw notFound('Game not found.');
  return toGameSummary(game);
}

export function getGameWithHands(id) {
  const summary = getGame(id);
  const hands = handRepo.getHandsForGame(id).map((h) => ({
    id: h.id,
    handNumber: h.hand_number,
    variant: h.variant,
    createdAt: h.created_at,
    updatedAt: h.updated_at,
    results: handRepo.getResultsForHand(h.id).map((r) => ({ playerId: r.player_id, amount: r.amount })),
  }));
  return { ...summary, hands };
}

export function getActiveGame() {
  const game = gameRepo.getActiveGame();
  return game ? toGameSummary(game) : null;
}

export function createGame(date, playerIds, chipsAmount, cashAmountCents) {
  if (!date) throw badRequest('Date is required.');
  if (!Array.isArray(playerIds) || playerIds.length < 2) {
    throw badRequest('At least two players are required to start a game.');
  }
  for (const id of playerIds) {
    if (!playerRepo.getPlayerById(id)) throw badRequest(`Player ${id} does not exist.`);
  }
  if (!Number.isInteger(chipsAmount) || chipsAmount <= 0) {
    throw badRequest('Chips amount must be a positive whole number.');
  }
  if (!Number.isInteger(cashAmountCents) || cashAmountCents <= 0) {
    throw badRequest('Cash amount must be a positive number.');
  }
  if (gameRepo.getActiveGame()) {
    throw conflict('A game is already in progress. Finish it before starting a new one.');
  }

  return transaction(() => {
    const game = gameRepo.createGame(date, chipsAmount, cashAmountCents);
    for (const playerId of playerIds) {
      gameRepo.addGamePlayer(game.id, playerId);
    }
    return toGameSummary(game);
  });
}

function assertInProgress(game) {
  if (game.status !== 'in_progress') {
    throw conflict('This game is finished. Reopen it explicitly to make changes.');
  }
}

export function endGame(id) {
  const game = gameRepo.getGameById(id);
  if (!game) throw notFound('Game not found.');
  assertInProgress(game);
  gameRepo.finishGame(id);
  return getGame(id);
}
