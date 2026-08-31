import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as playerService from '../src/services/playerService.js';
import * as gameService from '../src/services/gameService.js';
import { resetDb } from './helpers/resetDb.js';

beforeEach(async () => { await resetDb(); });

test('deletePlayer removes a player with no game history', async () => {
  const alice = await playerService.createPlayer('Alice');
  await playerService.deletePlayer(alice.id);
  await assert.rejects(playerService.getPlayer(alice.id), /not found/i);
});

test('deletePlayer refuses to remove a player who has joined a game', async () => {
  const alice = await playerService.createPlayer('Alice');
  const bob = await playerService.createPlayer('Bob');
  await gameService.createGame('2026-08-31', [alice.id, bob.id], 100, 2000);

  await assert.rejects(playerService.deletePlayer(alice.id), /game history/);
  assert.ok(await playerService.getPlayer(alice.id));
});

test('deletePlayer throws for an unknown player', async () => {
  await assert.rejects(playerService.deletePlayer(999), /not found/i);
});
