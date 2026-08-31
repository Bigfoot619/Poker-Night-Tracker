import { Router } from 'express';
import * as handService from '../services/handService.js';
import { asyncRoute } from '../middleware/errorHandler.js';

export const handsRouter = Router();

handsRouter.put('/:handId', asyncRoute(async (req, res) => {
  const hand = handService.editHand(Number(req.params.handId), req.body.results, req.body.variant);
  res.json(hand);
}));
