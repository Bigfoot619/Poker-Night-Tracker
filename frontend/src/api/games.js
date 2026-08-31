import { api } from './client.js';

export const listGames = () => api.get('/games');
export const getActiveGame = () => api.get('/games/active');
export const getGame = (id) => api.get(`/games/${id}`);
export const getGameHands = (id) => api.get(`/games/${id}/hands`);
export const createGame = (date, playerIds, chipsAmount, cashAmountCents) =>
  api.post('/games', { date, playerIds, chipsAmount, cashAmountCents });
export const endGame = (id) => api.post(`/games/${id}/end`);
