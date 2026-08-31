import { api } from './client.js';

export const saveHand = (gameId, results, variant) => api.post(`/games/${gameId}/hands`, { results, variant });
export const undoLastHand = (gameId) => api.delete(`/games/${gameId}/hands/last`);
export const editHand = (handId, results, variant) => api.put(`/hands/${handId}`, { results, variant });
