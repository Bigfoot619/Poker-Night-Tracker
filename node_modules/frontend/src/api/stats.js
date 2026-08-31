import { api } from './client.js';

export const getPlayerStats = (id, variant) =>
  api.get(`/players/${id}/stats${variant && variant !== 'all' ? `?variant=${variant}` : ''}`);

export const getPlayerVariantBreakdown = (id) => api.get(`/players/${id}/variant-breakdown`);

export const getLeaderboard = (sortBy, variant) => {
  const params = new URLSearchParams();
  if (sortBy) params.set('sortBy', sortBy);
  if (variant && variant !== 'all') params.set('variant', variant);
  const qs = params.toString();
  return api.get(`/leaderboard${qs ? `?${qs}` : ''}`);
};
