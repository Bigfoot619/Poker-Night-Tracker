import * as playerRepo from '../repositories/playerRepo.js';
import { badRequest, conflict, notFound } from '../errors.js';

export async function listPlayers() {
  return playerRepo.getAllPlayers();
}

export async function createPlayer(name) {
  const trimmed = (name ?? '').trim();
  if (!trimmed) throw badRequest('Player name is required.');
  if (await playerRepo.getPlayerByName(trimmed)) {
    throw conflict(`Player "${trimmed}" already exists.`);
  }
  return playerRepo.createPlayer(trimmed);
}

export async function getPlayer(id) {
  const player = await playerRepo.getPlayerById(id);
  if (!player) throw notFound('Player not found.');
  return player;
}

export async function deletePlayer(id) {
  const player = await playerRepo.getPlayerById(id);
  if (!player) throw notFound('Player not found.');
  if ((await playerRepo.getGameCountForPlayer(id)) > 0) {
    throw conflict(`Cannot delete "${player.name}" — they have game history. Deleting them would corrupt past results.`);
  }
  await playerRepo.deletePlayer(id);
}
