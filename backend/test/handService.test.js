import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as playerService from '../src/services/playerService.js';
import * as gameService from '../src/services/gameService.js';
import * as handService from '../src/services/handService.js';
import { resetDb } from './helpers/resetDb.js';

beforeEach(() => resetDb());

function setupGame() {
  const a = playerService.createPlayer('Alice');
  const b = playerService.createPlayer('Bob');
  const game = gameService.createGame('2026-08-31', [a.id, b.id], 100, 2000);
  return { a, b, game };
}

test('saveHand rejects a non-zero-sum hand', () => {
  const { a, b, game } = setupGame();
  assert.throws(
    () => handService.saveHand(game.id, [
      { playerId: a.id, amount: 100 },
      { playerId: b.id, amount: -90 },
    ]),
    /does not balance/
  );
});

test('saveHand rejects missing player results', () => {
  const { a, game } = setupGame();
  assert.throws(
    () => handService.saveHand(game.id, [{ playerId: a.id, amount: 0 }]),
    /every player/
  );
});

test('saveHand rejects a player not in the game', () => {
  const { a, b, game } = setupGame();
  const outsider = playerService.createPlayer('Eve');
  assert.throws(
    () => handService.saveHand(game.id, [
      { playerId: a.id, amount: 50 },
      { playerId: b.id, amount: -50 },
      { playerId: outsider.id, amount: 0 },
    ]),
    /not part of this game/
  );
});

test('saveHand rejects non-integer amounts', () => {
  const { a, b, game } = setupGame();
  assert.throws(
    () => handService.saveHand(game.id, [
      { playerId: a.id, amount: 50.5 },
      { playerId: b.id, amount: -50.5 },
    ]),
    /integer/
  );
});

test('saveHand numbers hands sequentially starting at 1', () => {
  const { a, b, game } = setupGame();
  const h1 = handService.saveHand(game.id, [{ playerId: a.id, amount: 100 }, { playerId: b.id, amount: -100 }]);
  const h2 = handService.saveHand(game.id, [{ playerId: a.id, amount: -50 }, { playerId: b.id, amount: 50 }]);
  assert.equal(h1.handNumber, 1);
  assert.equal(h2.handNumber, 2);
});

test('undoLastHand removes the most recent hand and frees its number', () => {
  const { a, b, game } = setupGame();
  handService.saveHand(game.id, [{ playerId: a.id, amount: 100 }, { playerId: b.id, amount: -100 }]);
  const removed = handService.undoLastHand(game.id);
  assert.equal(removed.removedHandNumber, 1);

  const next = handService.saveHand(game.id, [{ playerId: a.id, amount: 20 }, { playerId: b.id, amount: -20 }]);
  assert.equal(next.handNumber, 1, 'hand numbering should reuse the freed slot');
});

test('undoLastHand throws when there are no hands', () => {
  const { game } = setupGame();
  assert.throws(() => handService.undoLastHand(game.id), /No hands to undo/);
});

test('editHand re-validates zero-sum and updates results', () => {
  const { a, b, game } = setupGame();
  const hand = handService.saveHand(game.id, [{ playerId: a.id, amount: 100 }, { playerId: b.id, amount: -100 }]);

  assert.throws(
    () => handService.editHand(hand.id, [{ playerId: a.id, amount: 10 }, { playerId: b.id, amount: -5 }]),
    /does not balance/
  );

  const edited = handService.editHand(hand.id, [{ playerId: a.id, amount: 30 }, { playerId: b.id, amount: -30 }]);
  assert.equal(edited.results.find((r) => r.playerId === a.id).amount, 30);
});

test('game and hand mutations are rejected once the game is finished', () => {
  const { a, b, game } = setupGame();
  handService.saveHand(game.id, [{ playerId: a.id, amount: 100 }, { playerId: b.id, amount: -100 }]);
  gameService.endGame(game.id);

  assert.throws(
    () => handService.saveHand(game.id, [{ playerId: a.id, amount: 10 }, { playerId: b.id, amount: -10 }]),
    /finished/
  );
  assert.throws(() => handService.undoLastHand(game.id), /finished/);
});

test('createGame refuses to start a second game while one is in progress', () => {
  setupGame();
  const c = playerService.createPlayer('Carol');
  const d = playerService.createPlayer('Dave');
  assert.throws(() => gameService.createGame('2026-09-01', [c.id, d.id], 100, 2000), /already in progress/);
});

test('createGame requires a valid chips/cash ratio and saves it on the game', () => {
  const a = playerService.createPlayer('Alice');
  const b = playerService.createPlayer('Bob');

  assert.throws(() => gameService.createGame('2026-08-31', [a.id, b.id], 0, 2000), /Chips amount/);
  assert.throws(() => gameService.createGame('2026-08-31', [a.id, b.id], 100, 0), /Cash amount/);
  assert.throws(() => gameService.createGame('2026-08-31', [a.id, b.id], 100.5, 2000), /Chips amount/);

  const game = gameService.createGame('2026-08-31', [a.id, b.id], 100, 2000);
  assert.equal(game.chips_amount, 100);
  assert.equal(game.cash_amount_cents, 2000);
});

test('saveHand defaults to Poker and stores whichever variant is passed', () => {
  const { a, b, game } = setupGame();
  const defaulted = handService.saveHand(game.id, [{ playerId: a.id, amount: 10 }, { playerId: b.id, amount: -10 }]);
  assert.equal(defaulted.variant, 'Poker');

  const blackjack = handService.saveHand(
    game.id,
    [{ playerId: a.id, amount: 20 }, { playerId: b.id, amount: -20 }],
    'BlackJack'
  );
  assert.equal(blackjack.variant, 'BlackJack');
});

test('saveHand rejects an unknown variant', () => {
  const { a, b, game } = setupGame();
  assert.throws(
    () => handService.saveHand(game.id, [{ playerId: a.id, amount: 10 }, { playerId: b.id, amount: -10 }], 'Bridge'),
    /Unknown game variant/
  );
});

test('bouncing between variants within one game keeps hand numbering continuous and preserves prior hands', () => {
  const { a, b, game } = setupGame();
  const h1 = handService.saveHand(game.id, [{ playerId: a.id, amount: 10 }, { playerId: b.id, amount: -10 }], 'Poker');
  const h2 = handService.saveHand(game.id, [{ playerId: a.id, amount: 20 }, { playerId: b.id, amount: -20 }], 'Chop');
  const h3 = handService.saveHand(game.id, [{ playerId: a.id, amount: -5 }, { playerId: b.id, amount: 5 }], 'Poker');

  assert.deepEqual([h1.handNumber, h2.handNumber, h3.handNumber], [1, 2, 3]);
  assert.deepEqual([h1.variant, h2.variant, h3.variant], ['Poker', 'Chop', 'Poker']);
});

test('editHand can change a hand\'s variant without touching amounts elsewhere', () => {
  const { a, b, game } = setupGame();
  const hand = handService.saveHand(game.id, [{ playerId: a.id, amount: 10 }, { playerId: b.id, amount: -10 }], 'Poker');
  const edited = handService.editHand(hand.id, [{ playerId: a.id, amount: 10 }, { playerId: b.id, amount: -10 }], 'Ptihot');
  assert.equal(edited.variant, 'Ptihot');
});
