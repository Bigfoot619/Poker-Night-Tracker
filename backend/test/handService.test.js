import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as playerService from '../src/services/playerService.js';
import * as gameService from '../src/services/gameService.js';
import * as handService from '../src/services/handService.js';
import { resetDb } from './helpers/resetDb.js';

beforeEach(async () => { await resetDb(); });

async function setupGame() {
  const a = await playerService.createPlayer('Alice');
  const b = await playerService.createPlayer('Bob');
  const game = await gameService.createGame('2026-08-31', [a.id, b.id], 100, 2000);
  return { a, b, game };
}

test('saveHand rejects a non-zero-sum hand', async () => {
  const { a, b, game } = await setupGame();
  await assert.rejects(
    handService.saveHand(game.id, [
      { playerId: a.id, amount: 100 },
      { playerId: b.id, amount: -90 },
    ]),
    /does not balance/
  );
});

test('saveHand rejects missing player results', async () => {
  const { a, game } = await setupGame();
  await assert.rejects(
    handService.saveHand(game.id, [{ playerId: a.id, amount: 0 }]),
    /every player/
  );
});

test('saveHand rejects a player not in the game', async () => {
  const { a, b, game } = await setupGame();
  const outsider = await playerService.createPlayer('Eve');
  await assert.rejects(
    handService.saveHand(game.id, [
      { playerId: a.id, amount: 50 },
      { playerId: b.id, amount: -50 },
      { playerId: outsider.id, amount: 0 },
    ]),
    /not part of this game/
  );
});

test('saveHand rejects non-integer amounts', async () => {
  const { a, b, game } = await setupGame();
  await assert.rejects(
    handService.saveHand(game.id, [
      { playerId: a.id, amount: 50.5 },
      { playerId: b.id, amount: -50.5 },
    ]),
    /integer/
  );
});

test('saveHand numbers hands sequentially starting at 1', async () => {
  const { a, b, game } = await setupGame();
  const h1 = await handService.saveHand(game.id, [{ playerId: a.id, amount: 100 }, { playerId: b.id, amount: -100 }]);
  const h2 = await handService.saveHand(game.id, [{ playerId: a.id, amount: -50 }, { playerId: b.id, amount: 50 }]);
  assert.equal(h1.handNumber, 1);
  assert.equal(h2.handNumber, 2);
});

test('undoLastHand removes the most recent hand and frees its number', async () => {
  const { a, b, game } = await setupGame();
  await handService.saveHand(game.id, [{ playerId: a.id, amount: 100 }, { playerId: b.id, amount: -100 }]);
  const removed = await handService.undoLastHand(game.id);
  assert.equal(removed.removedHandNumber, 1);

  const next = await handService.saveHand(game.id, [{ playerId: a.id, amount: 20 }, { playerId: b.id, amount: -20 }]);
  assert.equal(next.handNumber, 1, 'hand numbering should reuse the freed slot');
});

test('undoLastHand throws when there are no hands', async () => {
  const { game } = await setupGame();
  await assert.rejects(handService.undoLastHand(game.id), /No hands to undo/);
});

test('editHand re-validates zero-sum and updates results', async () => {
  const { a, b, game } = await setupGame();
  const hand = await handService.saveHand(game.id, [{ playerId: a.id, amount: 100 }, { playerId: b.id, amount: -100 }]);

  await assert.rejects(
    handService.editHand(hand.id, [{ playerId: a.id, amount: 10 }, { playerId: b.id, amount: -5 }]),
    /does not balance/
  );

  const edited = await handService.editHand(hand.id, [{ playerId: a.id, amount: 30 }, { playerId: b.id, amount: -30 }]);
  assert.equal(edited.results.find((r) => r.playerId === a.id).amount, 30);
});

test('game and hand mutations are rejected once the game is finished', async () => {
  const { a, b, game } = await setupGame();
  await handService.saveHand(game.id, [{ playerId: a.id, amount: 100 }, { playerId: b.id, amount: -100 }]);
  await gameService.endGame(game.id);

  await assert.rejects(
    handService.saveHand(game.id, [{ playerId: a.id, amount: 10 }, { playerId: b.id, amount: -10 }]),
    /finished/
  );
  await assert.rejects(handService.undoLastHand(game.id), /finished/);
});

test('createGame refuses to start a second game while one is in progress', async () => {
  await setupGame();
  const c = await playerService.createPlayer('Carol');
  const d = await playerService.createPlayer('Dave');
  await assert.rejects(gameService.createGame('2026-09-01', [c.id, d.id], 100, 2000), /already in progress/);
});

test('createGame requires a valid chips/cash ratio and saves it on the game', async () => {
  const a = await playerService.createPlayer('Alice');
  const b = await playerService.createPlayer('Bob');

  await assert.rejects(gameService.createGame('2026-08-31', [a.id, b.id], 0, 2000), /Chips amount/);
  await assert.rejects(gameService.createGame('2026-08-31', [a.id, b.id], 100, 0), /Cash amount/);
  await assert.rejects(gameService.createGame('2026-08-31', [a.id, b.id], 100.5, 2000), /Chips amount/);

  const game = await gameService.createGame('2026-08-31', [a.id, b.id], 100, 2000);
  assert.equal(game.chips_amount, 100);
  assert.equal(game.cash_amount_cents, 2000);
});

test('saveHand defaults to Poker and stores whichever variant is passed', async () => {
  const { a, b, game } = await setupGame();
  const defaulted = await handService.saveHand(game.id, [{ playerId: a.id, amount: 10 }, { playerId: b.id, amount: -10 }]);
  assert.equal(defaulted.variant, 'Poker');

  const blackjack = await handService.saveHand(
    game.id,
    [{ playerId: a.id, amount: 20 }, { playerId: b.id, amount: -20 }],
    'BlackJack'
  );
  assert.equal(blackjack.variant, 'BlackJack');
});

test('saveHand rejects an unknown variant', async () => {
  const { a, b, game } = await setupGame();
  await assert.rejects(
    handService.saveHand(game.id, [{ playerId: a.id, amount: 10 }, { playerId: b.id, amount: -10 }], 'Bridge'),
    /Unknown game variant/
  );
});

test('bouncing between variants within one game keeps hand numbering continuous and preserves prior hands', async () => {
  const { a, b, game } = await setupGame();
  const h1 = await handService.saveHand(game.id, [{ playerId: a.id, amount: 10 }, { playerId: b.id, amount: -10 }], 'Poker');
  const h2 = await handService.saveHand(game.id, [{ playerId: a.id, amount: 20 }, { playerId: b.id, amount: -20 }], 'Chop');
  const h3 = await handService.saveHand(game.id, [{ playerId: a.id, amount: -5 }, { playerId: b.id, amount: 5 }], 'Poker');

  assert.deepEqual([h1.handNumber, h2.handNumber, h3.handNumber], [1, 2, 3]);
  assert.deepEqual([h1.variant, h2.variant, h3.variant], ['Poker', 'Chop', 'Poker']);
});

test('editHand can change a hand\'s variant without touching amounts elsewhere', async () => {
  const { a, b, game } = await setupGame();
  const hand = await handService.saveHand(game.id, [{ playerId: a.id, amount: 10 }, { playerId: b.id, amount: -10 }], 'Poker');
  const edited = await handService.editHand(hand.id, [{ playerId: a.id, amount: 10 }, { playerId: b.id, amount: -10 }], 'Ptihot');
  assert.equal(edited.variant, 'Ptihot');
});
