import { Router } from 'express';
import * as playerService from '../services/playerService.js';
import * as statsService from '../services/statsService.js';
import { asyncRoute } from '../middleware/errorHandler.js';

export const playersRouter = Router();

playersRouter.get('/', asyncRoute(async (req, res) => {
  res.json(playerService.listPlayers());
}));

playersRouter.post('/', asyncRoute(async (req, res) => {
  const player = playerService.createPlayer(req.body.name);
  res.status(201).json(player);
}));

playersRouter.get('/:id', asyncRoute(async (req, res) => {
  res.json(playerService.getPlayer(Number(req.params.id)));
}));

playersRouter.delete('/:id', asyncRoute(async (req, res) => {
  playerService.deletePlayer(Number(req.params.id));
  res.status(204).end();
}));

playersRouter.get('/:id/stats', asyncRoute(async (req, res) => {
  res.json(statsService.getPlayerStats(Number(req.params.id), req.query.variant));
}));

playersRouter.get('/:id/variant-breakdown', asyncRoute(async (req, res) => {
  res.json(statsService.getPlayerVariantBreakdown(Number(req.params.id)));
}));
