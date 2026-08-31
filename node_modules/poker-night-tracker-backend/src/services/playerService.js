import * as playerRepo from '../repositories/playerRepo.js';
import { badRequest, conflict, notFound } from '../errors.js';

export function listPlayers() {
  return playerRepo.getAllPlayers();
}

export function createPlayer(name) {
  const trimmed = (name ?? '').trim();
  if (!trimmed) throw badRequest('Player name is required.');
  if (playerRepo.getPlayerByName(trimmed)) {
    throw conflict(`Player "${trimmed}" already exists.`);
  }
  return playerRepo.createPlayer(trimmed);
}

export function getPlayer(id) {
  const player = playerRepo.getPlayerById(id);
  if (!player) throw notFound('Player not found.');
  return player;
}

export function deletePlayer(id) {
  const player = playerRepo.getPlayerById(id);
  if (!player) throw notFound('Player not found.');
  if (playerRepo.getGameCountForPlayer(id) > 0) {
    throw conflict(`Cannot delete "${player.name}" — they have game history. Deleting them would corrupt past results.`);
  }
  playerRepo.deletePlayer(id);
}
