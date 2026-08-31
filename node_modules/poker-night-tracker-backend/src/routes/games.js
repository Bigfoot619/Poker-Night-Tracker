import { Router } from 'express';
import * as gameService from '../services/gameService.js';
import * as handService from '../services/handService.js';
import { asyncRoute } from '../middleware/errorHandler.js';

export const gamesRouter = Router();

gamesRouter.get('/', asyncRoute(async (req, res) => {
  res.json(gameService.listGames());
}));

gamesRouter.get('/active', asyncRoute(async (req, res) => {
  res.json(gameService.getActiveGame());
}));

gamesRouter.post('/', asyncRoute(async (req, res) => {
  const { date, playerIds, chipsAmount, cashAmountCents } = req.body;
  const game = gameService.createGame(date, playerIds, chipsAmount, cashAmountCents);
  res.status(201).json(game);
}));

gamesRouter.get('/:id', asyncRoute(async (req, res) => {
  res.json(gameService.getGame(Number(req.params.id)));
}));

gamesRouter.get('/:id/hands', asyncRoute(async (req, res) => {
  res.json(gameService.getGameWithHands(Number(req.params.id)).hands);
}));

gamesRouter.post('/:id/hands', asyncRoute(async (req, res) => {
  const hand = handService.saveHand(Number(req.params.id), req.body.results, req.body.variant);
  res.status(201).json(hand);
}));

gamesRouter.delete('/:id/hands/last', asyncRoute(async (req, res) => {
  res.json(handService.undoLastHand(Number(req.params.id)));
}));

gamesRouter.post('/:id/end', asyncRoute(async (req, res) => {
  res.json(gameService.endGame(Number(req.params.id)));
}));
