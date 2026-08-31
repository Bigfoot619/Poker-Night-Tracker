import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as playerService from '../src/services/playerService.js';
import * as gameService from '../src/services/gameService.js';
import { resetDb } from './helpers/resetDb.js';

beforeEach(() => resetDb());

test('deletePlayer removes a player with no game history', () => {
  const alice = playerService.createPlayer('Alice');
  playerService.deletePlayer(alice.id);
  assert.throws(() => playerService.getPlayer(alice.id), /not found/i);
});

test('deletePlayer refuses to remove a player who has joined a game', () => {
  const alice = playerService.createPlayer('Alice');
  const bob = playerService.createPlayer('Bob');
  gameService.createGame('2026-08-31', [alice.id, bob.id], 100, 2000);

  assert.throws(() => playerService.deletePlayer(alice.id), /game history/);
  assert.ok(playerService.getPlayer(alice.id));
});

test('deletePlayer throws for an unknown player', () => {
  assert.throws(() => playerService.deletePlayer(999), /not found/i);
});
