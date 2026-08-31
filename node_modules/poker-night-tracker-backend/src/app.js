import express from 'express';
import cors from 'cors';
import { playersRouter } from './routes/players.js';
import { gamesRouter } from './routes/games.js';
import { handsRouter } from './routes/hands.js';
import { leaderboardRouter } from './routes/leaderboard.js';
import { errorHandler } from './middleware/errorHandler.js';

export const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/players', playersRouter);
app.use('/api/games', gamesRouter);
app.use('/api/hands', handsRouter);
app.use('/api/leaderboard', leaderboardRouter);

app.use(errorHandler);
