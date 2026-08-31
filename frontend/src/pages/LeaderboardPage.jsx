import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getLeaderboard } from '../api/stats.js';
import { formatMoney, formatPercent } from '../api/client.js';
import { PlayerAvatar } from '../components/shared/PlayerAvatar.jsx';
import { VariantSelector } from '../components/shared/VariantSelector.jsx';

const METRICS = [
  { key: 'totalProfit', label: 'Total Profit', format: (s) => formatMoney(s.totalProfit) },
  { key: 'avgProfitPerGame', label: 'Avg / Game', format: (s) => formatMoney(s.avgProfitPerGame) },
  { key: 'avgProfitPerHand', label: 'Avg / Hand', format: (s) => formatMoney(s.avgProfitPerHand) },
  { key: 'winRate', label: 'Win Rate', format: (s) => formatPercent(s.winRate) },
  { key: 'gamesPlayed', label: 'Games Played', format: (s) => s.gamesPlayed },
  {
    key: 'bestGame',
    label: 'Biggest Game',
    format: (s) => formatMoney(s.bestGame?.amount ?? 0),
    date: (s) => s.bestGame?.date,
  },
  {
    key: 'bestHand',
    label: 'Biggest Hand',
    format: (s) => formatMoney(s.bestHand?.amount ?? 0),
    date: (s) => s.bestHand?.date,
  },
];

export function LeaderboardPage() {
  const [sortBy, setSortBy] = useState('totalProfit');
  const [variant, setVariant] = useState('all');
  const [board, setBoard] = useState(null);

  useEffect(() => { getLeaderboard(sortBy, variant).then(setBoard); }, [sortBy, variant]);

  const metric = METRICS.find((m) => m.key === sortBy);

  return (
    <div>
      <h2>All-Time Leaderboard</h2>

      <h3 style={{ fontSize: '0.8rem', marginBottom: 6 }}>Variant</h3>
      <VariantSelector value={variant} onChange={setVariant} includeAll />

      <h3 style={{ fontSize: '0.8rem', marginBottom: 6 }}>Sort by</h3>
      <div className="sort-tabs">
        {METRICS.map((m) => (
          <button
            key={m.key}
            className={sortBy === m.key ? 'active' : ''}
            onClick={() => setSortBy(m.key)}
          >
            {m.label}
          </button>
        ))}
      </div>

      {!board ? (
        <p>Loading...</p>
      ) : board.entries.length === 0 ? (
        <p className="empty-state">
          {variant === 'all'
            ? 'No finished games yet. The leaderboard fills in once a game is completed.'
            : `Nobody has played ${variant} in a finished game yet.`}
        </p>
      ) : (
        board.entries.map((entry, i) => (
          <Link key={entry.player.id} to={`/players/${entry.player.id}`} className="leaderboard-row">
            <span className="leaderboard-rank">{i + 1}</span>
            <PlayerAvatar name={entry.player.name} size={32} />
            <span className="leaderboard-name">{entry.player.name}</span>
            <span style={{ textAlign: 'right' }}>
              <span className="money">{metric.format(entry.stats)}</span>
              {metric.date && metric.date(entry.stats) && (
                <span className="stat-date" style={{ display: 'block' }}>{metric.date(entry.stats)}</span>
              )}
            </span>
          </Link>
        ))
      )}
    </div>
  );
}
