import { Router } from 'express';
import * as statsService from '../services/statsService.js';
import { asyncRoute } from '../middleware/errorHandler.js';

export const leaderboardRouter = Router();

leaderboardRouter.get('/', asyncRoute(async (req, res) => {
  res.json(await statsService.getLeaderboard(req.query.sortBy, req.query.variant));
}));
