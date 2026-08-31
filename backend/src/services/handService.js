import * as handRepo from '../repositories/handRepo.js';
import * as gameRepo from '../repositories/gameRepo.js';
import { transaction } from '../db/index.js';
import { badRequest, notFound, conflict } from '../errors.js';
import { GAME_VARIANTS, DEFAULT_VARIANT } from '../constants.js';

function validateResults(results, gamePlayers) {
  if (!Array.isArray(results) || results.length === 0) {
    throw badRequest('Hand results are required.');
  }

  const validPlayerIds = new Set(gamePlayers.map((p) => p.id));
  const seen = new Set();

  for (const r of results) {
    if (typeof r.playerId !== 'number' || !validPlayerIds.has(r.playerId)) {
      throw badRequest(`Player ${r.playerId} is not part of this game.`);
    }
    if (!Number.isInteger(r.amount)) {
      throw badRequest('Each amount must be an integer (cents).');
    }
    if (seen.has(r.playerId)) {
      throw badRequest(`Duplicate result for player ${r.playerId}.`);
    }
    seen.add(r.playerId);
  }

  if (seen.size !== validPlayerIds.size) {
    throw badRequest('A result must be provided for every player in the game.');
  }

  const total = results.reduce((sum, r) => sum + r.amount, 0);
  if (total !== 0) {
    throw badRequest(`Hand does not balance to zero (total: ${total}).`);
  }
}

function resolveVariant(variant) {
  if (variant === undefined || variant === null) return DEFAULT_VARIANT;
  if (!GAME_VARIANTS.includes(variant)) {
    throw badRequest(`Unknown game variant "${variant}".`);
  }
  return variant;
}

function assertInProgress(game) {
  if (!game) throw notFound('Game not found.');
  if (game.status !== 'in_progress') {
    throw conflict('This game is finished. Reopen it explicitly to make changes.');
  }
  return game;
}

export function saveHand(gameId, results, variant) {
  const game = assertInProgress(gameRepo.getGameById(gameId));
  const gamePlayers = gameRepo.getGamePlayers(gameId);
  validateResults(results, gamePlayers);
  const resolvedVariant = resolveVariant(variant);

  return transaction(() => {
    const nextNumber = handRepo.getMaxHandNumber(gameId) + 1;
    const handId = handRepo.insertHand(gameId, nextNumber, resolvedVariant);
    for (const r of results) {
      handRepo.insertHandResult(handId, r.playerId, r.amount);
    }
    return {
      id: handId,
      handNumber: nextNumber,
      variant: resolvedVariant,
      results: handRepo.getResultsForHand(handId).map((r) => ({ playerId: r.player_id, amount: r.amount })),
    };
  });
}

export function undoLastHand(gameId) {
  const game = assertInProgress(gameRepo.getGameById(gameId));
  const lastHand = handRepo.getLastHand(gameId);
  if (!lastHand) throw notFound('No hands to undo.');
  handRepo.deleteHand(lastHand.id);
  return { removedHandNumber: lastHand.hand_number };
}

export function editHand(handId, results, variant) {
  const hand = handRepo.getHandById(handId);
  if (!hand) throw notFound('Hand not found.');
  const game = assertInProgress(gameRepo.getGameById(hand.game_id));
  const gamePlayers = gameRepo.getGamePlayers(hand.game_id);
  validateResults(results, gamePlayers);
  const resolvedVariant = variant === undefined ? hand.variant : resolveVariant(variant);

  return transaction(() => {
    handRepo.clearHandResults(handId);
    for (const r of results) {
      handRepo.insertHandResult(handId, r.playerId, r.amount);
    }
    handRepo.setHandVariant(handId, resolvedVariant);
    handRepo.touchHand(handId);
    return {
      id: handId,
      handNumber: hand.hand_number,
      variant: resolvedVariant,
      results: handRepo.getResultsForHand(handId).map((r) => ({ playerId: r.player_id, amount: r.amount })),
    };
  });
}
