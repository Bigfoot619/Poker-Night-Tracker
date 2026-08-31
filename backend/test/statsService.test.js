import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as playerService from '../src/services/playerService.js';
import * as gameService from '../src/services/gameService.js';
import * as handService from '../src/services/handService.js';
import * as statsService from '../src/services/statsService.js';
import { resetDb } from './helpers/resetDb.js';

beforeEach(async () => { await resetDb(); });

async function playHandsAndFinish(playerIds, hands, date = '2026-08-31') {
  const game = await gameService.createGame(date, playerIds, 100, 2000);
  for (const hand of hands) {
    const { results, variant } = Array.isArray(hand) ? { results: hand, variant: undefined } : hand;
    await handService.saveHand(game.id, results, variant);
  }
  return gameService.endGame(game.id);
}

test('computeStatsForPlayer aggregates profit, win rate, and best/worst across finished games', async () => {
  const alice = await playerService.createPlayer('Alice');
  const bob = await playerService.createPlayer('Bob');

  // Game 1: Alice ends +150 (winning game)
  const game1 = await playHandsAndFinish([alice.id, bob.id], [
    [{ playerId: alice.id, amount: 100 }, { playerId: bob.id, amount: -100 }],
    [{ playerId: alice.id, amount: 50 }, { playerId: bob.id, amount: -50 }],
  ], '2026-08-20');

  // Game 2: Alice ends -40 (losing game)
  const game2 = await playHandsAndFinish([alice.id, bob.id], [
    [{ playerId: alice.id, amount: -40 }, { playerId: bob.id, amount: 40 }],
  ], '2026-08-27');

  const { stats } = await statsService.getPlayerStats(alice.id);

  assert.equal(stats.gamesPlayed, 2);
  assert.equal(stats.handsPlayed, 3);
  assert.equal(stats.totalProfit, 110); // 150 - 40
  assert.equal(stats.winningGames, 1);
  assert.equal(stats.losingGames, 1);
  assert.equal(stats.winRate, 0.5);
  assert.equal(stats.avgProfitPerGame, 55);

  assert.equal(stats.bestGame.amount, 150);
  assert.equal(stats.bestGame.date, '2026-08-20');
  assert.equal(stats.bestGame.gameId, game1.id);

  assert.equal(stats.worstGame.amount, -40);
  assert.equal(stats.worstGame.date, '2026-08-27');
  assert.equal(stats.worstGame.gameId, game2.id);

  assert.equal(stats.bestHand.amount, 100);
  assert.equal(stats.bestHand.date, '2026-08-20');
  assert.equal(stats.bestHand.handNumber, 1);

  assert.equal(stats.worstHand.amount, -40);
  assert.equal(stats.worstHand.date, '2026-08-27');
  assert.equal(stats.worstHand.handNumber, 1);
});

test('computeStatsForPlayer ignores in-progress games', async () => {
  const alice = await playerService.createPlayer('Alice');
  const bob = await playerService.createPlayer('Bob');
  const game = await gameService.createGame('2026-08-31', [alice.id, bob.id], 100, 2000);
  await handService.saveHand(game.id, [{ playerId: alice.id, amount: 500 }, { playerId: bob.id, amount: -500 }]);

  const { stats } = await statsService.getPlayerStats(alice.id);
  assert.equal(stats.gamesPlayed, 0);
  assert.equal(stats.totalProfit, 0);
  assert.equal(stats.bestGame, null);
  assert.equal(stats.bestHand, null);
});

test('getLeaderboard sorts players by the requested metric', async () => {
  const alice = await playerService.createPlayer('Alice');
  const bob = await playerService.createPlayer('Bob');

  await playHandsAndFinish([alice.id, bob.id], [
    [{ playerId: alice.id, amount: 200 }, { playerId: bob.id, amount: -200 }],
  ]);

  const board = await statsService.getLeaderboard('totalProfit');
  assert.equal(board.entries[0].player.name, 'Alice');
  assert.equal(board.entries[1].player.name, 'Bob');
  assert.equal(board.entries[0].stats.totalProfit, 200);
  assert.equal(board.entries[1].stats.totalProfit, -200);

  const byBestHand = await statsService.getLeaderboard('bestHand');
  assert.equal(byBestHand.entries[0].player.name, 'Alice');
  assert.equal(byBestHand.entries[0].stats.bestHand.amount, 200);
});

test('getPlayerStats throws for an unknown player', async () => {
  await assert.rejects(statsService.getPlayerStats(999), /not found/i);
});

test('computeStatsForPlayer filters by variant while bouncing between variants in one game', async () => {
  const alice = await playerService.createPlayer('Alice');
  const bob = await playerService.createPlayer('Bob');

  // One night, three variants mixed together — should not create separate games.
  await playHandsAndFinish([alice.id, bob.id], [
    { results: [{ playerId: alice.id, amount: 100 }, { playerId: bob.id, amount: -100 }], variant: 'Poker' },
    { results: [{ playerId: alice.id, amount: -30 }, { playerId: bob.id, amount: 30 }], variant: 'BlackJack' },
    { results: [{ playerId: alice.id, amount: 60 }, { playerId: bob.id, amount: -60 }], variant: 'Poker' },
  ]);

  const all = await statsService.computeStatsForPlayer(alice.id, 'all');
  assert.equal(all.gamesPlayed, 1);
  assert.equal(all.handsPlayed, 3);
  assert.equal(all.totalProfit, 130);

  const poker = await statsService.computeStatsForPlayer(alice.id, 'Poker');
  assert.equal(poker.handsPlayed, 2);
  assert.equal(poker.totalProfit, 160);
  assert.equal(poker.gamesPlayed, 1);

  const blackjack = await statsService.computeStatsForPlayer(alice.id, 'BlackJack');
  assert.equal(blackjack.handsPlayed, 1);
  assert.equal(blackjack.totalProfit, -30);

  const chop = await statsService.computeStatsForPlayer(alice.id, 'Chop');
  assert.equal(chop.handsPlayed, 0);
  assert.equal(chop.gamesPlayed, 0);
  assert.equal(chop.bestHand, null);
});

test('getLeaderboard filters entries down to players who played that variant', async () => {
  const alice = await playerService.createPlayer('Alice');
  const bob = await playerService.createPlayer('Bob');
  const carol = await playerService.createPlayer('Carol');

  await playHandsAndFinish([alice.id, bob.id], [
    { results: [{ playerId: alice.id, amount: 100 }, { playerId: bob.id, amount: -100 }], variant: 'Poker' },
  ]);
  await playHandsAndFinish([bob.id, carol.id], [
    { results: [{ playerId: bob.id, amount: 50 }, { playerId: carol.id, amount: -50 }], variant: 'Chop' },
  ]);

  const pokerBoard = await statsService.getLeaderboard('totalProfit', 'Poker');
  assert.equal(pokerBoard.entries.length, 2); // only Alice & Bob played Poker
  assert.ok(pokerBoard.entries.every((e) => e.player.name !== 'Carol'));

  const chopBoard = await statsService.getLeaderboard('totalProfit', 'Chop');
  assert.equal(chopBoard.entries.length, 2); // only Bob & Carol played Chop
  assert.ok(chopBoard.entries.every((e) => e.player.name !== 'Alice'));
});

test('getPlayerVariantBreakdown summarizes profit per variant', async () => {
  const alice = await playerService.createPlayer('Alice');
  const bob = await playerService.createPlayer('Bob');

  await playHandsAndFinish([alice.id, bob.id], [
    { results: [{ playerId: alice.id, amount: 100 }, { playerId: bob.id, amount: -100 }], variant: 'Poker' },
    { results: [{ playerId: alice.id, amount: 50 }, { playerId: bob.id, amount: -50 }], variant: 'Poker' },
    { results: [{ playerId: alice.id, amount: -20 }, { playerId: bob.id, amount: 20 }], variant: 'Chop' },
  ]);

  const { breakdown } = await statsService.getPlayerVariantBreakdown(alice.id);
  assert.equal(breakdown.length, 2);
  const poker = breakdown.find((b) => b.variant === 'Poker');
  const chop = breakdown.find((b) => b.variant === 'Chop');
  assert.equal(poker.handsPlayed, 2);
  assert.equal(poker.totalProfit, 150);
  assert.equal(chop.handsPlayed, 1);
  assert.equal(chop.totalProfit, -20);
});
