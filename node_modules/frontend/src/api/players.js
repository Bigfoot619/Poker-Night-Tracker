import { api } from './client.js';

export const listPlayers = () => api.get('/players');
export const createPlayer = (name) => api.post('/players', { name });
export const getPlayer = (id) => api.get(`/players/${id}`);
export const deletePlayer = (id) => api.delete(`/players/${id}`);
