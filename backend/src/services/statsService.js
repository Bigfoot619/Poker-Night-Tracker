import * as statsRepo from '../repositories/statsRepo.js';
import * as playerRepo from '../repositories/playerRepo.js';
import { notFound } from '../errors.js';
import { GAME_VARIANTS } from '../constants.js';

function extreme(items, key, comparator) {
  if (items.length === 0) return null;
  return items.reduce((best, item) => (comparator(item[key], best[key]) ? item : best));
}

function groupHandsByGame(hands) {
  const gameMap = new Map();
  for (const h of hands) {
    const existing = gameMap.get(h.gameId);
    if (existing) {
      existing.total += h.amount;
    } else {
      gameMap.set(h.gameId, { gameId: h.gameId, date: h.date, total: h.amount });
    }
  }
  return [...gameMap.values()];
}

export function computeStatsForPlayer(playerId, variant = 'all') {
  let hands = statsRepo.getFinishedHandRecordsForPlayer(playerId);
  if (variant !== 'all') {
    hands = hands.filter((h) => h.variant === variant);
  }

  const games = groupHandsByGame(hands);

  const gamesPlayed = games.length;
  const handsPlayed = hands.length;
  const totalProfit = hands.reduce((sum, h) => sum + h.amount, 0);

  const winningGames = games.filter((g) => g.total > 0).length;
  const losingGames = games.filter((g) => g.total < 0).length;

  const bestGameRow = extreme(games, 'total', (a, b) => a > b);
  const worstGameRow = extreme(games, 'total', (a, b) => a < b);
  const bestHandRow = extreme(hands, 'amount', (a, b) => a > b);
  const worstHandRow = extreme(hands, 'amount', (a, b) => a < b);

  return {
    playerId,
    variant,
    gamesPlayed,
    handsPlayed,
    totalProfit,
    avgProfitPerGame: gamesPlayed ? totalProfit / gamesPlayed : 0,
    avgProfitPerHand: handsPlayed ? totalProfit / handsPlayed : 0,
    winningGames,
    losingGames,
    winRate: gamesPlayed ? winningGames / gamesPlayed : 0,
    bestGame: bestGameRow && { amount: bestGameRow.total, date: bestGameRow.date, gameId: bestGameRow.gameId },
    worstGame: worstGameRow && { amount: worstGameRow.total, date: worstGameRow.date, gameId: worstGameRow.gameId },
    bestHand: bestHandRow && {
      amount: bestHandRow.amount,
      date: bestHandRow.date,
      gameId: bestHandRow.gameId,
      handNumber: bestHandRow.handNumber,
      variant: bestHandRow.variant,
    },
    worstHand: worstHandRow && {
      amount: worstHandRow.amount,
      date: worstHandRow.date,
      gameId: worstHandRow.gameId,
      handNumber: worstHandRow.handNumber,
      variant: worstHandRow.variant,
    },
  };
}

export function getPlayerStats(playerId, variant = 'all') {
  const player = playerRepo.getPlayerById(playerId);
  if (!player) throw notFound('Player not found.');
  return { player, stats: computeStatsForPlayer(playerId, variant) };
}

export function getPlayerVariantBreakdown(playerId) {
  const player = playerRepo.getPlayerById(playerId);
  if (!player) throw notFound('Player not found.');

  const hands = statsRepo.getFinishedHandRecordsForPlayer(playerId);
  const byVariant = new Map();
  for (const h of hands) {
    const entry = byVariant.get(h.variant) ?? { variant: h.variant, handsPlayed: 0, totalProfit: 0 };
    entry.handsPlayed += 1;
    entry.totalProfit += h.amount;
    byVariant.set(h.variant, entry);
  }

  const breakdown = [...byVariant.values()]
    .map((v) => ({ ...v, avgProfitPerHand: v.totalProfit / v.handsPlayed }))
    .sort((a, b) => b.totalProfit - a.totalProfit);

  return { player, breakdown };
}

const SORTABLE_METRICS = new Set([
  'totalProfit',
  'avgProfitPerGame',
  'avgProfitPerHand',
  'winRate',
  'gamesPlayed',
  'bestGame',
  'bestHand',
]);

function metricValue(stats, metric) {
  if (metric === 'bestGame' || metric === 'bestHand') {
    return stats[metric] ? stats[metric].amount : -Infinity;
  }
  return stats[metric];
}

export function getLeaderboard(sortBy = 'totalProfit', variant = 'all') {
  const metric = SORTABLE_METRICS.has(sortBy) ? sortBy : 'totalProfit';
  const normalizedVariant = variant === 'all' || GAME_VARIANTS.includes(variant) ? variant : 'all';

  const playerIds = statsRepo.getAllPlayerIdsWithFinishedGames();

  let rows = playerIds.map((id) => {
    const player = playerRepo.getPlayerById(id);
    const stats = computeStatsForPlayer(id, normalizedVariant);
    return { player, stats };
  });

  if (normalizedVariant !== 'all') {
    rows = rows.filter((r) => r.stats.handsPlayed > 0);
  }

  rows.sort((a, b) => metricValue(b.stats, metric) - metricValue(a.stats, metric));

  return { sortBy: metric, variant: normalizedVariant, entries: rows };
}
