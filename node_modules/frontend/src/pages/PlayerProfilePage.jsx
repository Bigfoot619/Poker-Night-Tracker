import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPlayerStats, getPlayerVariantBreakdown } from '../api/stats.js';
import { formatMoney, formatPercent } from '../api/client.js';
import { VariantSelector } from '../components/shared/VariantSelector.jsx';

function MoneyTile({ label, cents, dateInfo }) {
  const sign = cents > 0 ? 'positive' : cents < 0 ? 'negative' : 'zero';
  return (
    <div className="stat-tile">
      <div className="stat-label">{label}</div>
      <div className={`stat-value money ${sign}`}>{formatMoney(cents)}</div>
      {dateInfo && (
        <Link to={`/games/${dateInfo.gameId}`} className="stat-date">
          {dateInfo.date}{dateInfo.handNumber ? ` · Hand #${dateInfo.handNumber}` : ''}
        </Link>
      )}
    </div>
  );
}

export function PlayerProfilePage() {
  const { id } = useParams();
  const [variant, setVariant] = useState('all');
  const [data, setData] = useState(null);
  const [breakdown, setBreakdown] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getPlayerStats(Number(id), variant).then(setData).catch((err) => setError(err.message));
  }, [id, variant]);

  useEffect(() => {
    getPlayerVariantBreakdown(Number(id)).then(setBreakdown);
  }, [id]);

  if (error) return <p className="error-text">{error}</p>;
  if (!data) return <p>Loading...</p>;

  const { player, stats } = data;

  if (stats.handsPlayed === 0) {
    return (
      <div>
        <div className="page-header"><h2>{player.name}</h2></div>
        <VariantSelector value={variant} onChange={setVariant} includeAll />
        <p className="empty-state">
          {variant === 'all'
            ? 'No finished games yet. Stats appear once this player has completed at least one game.'
            : `${player.name} hasn't played ${variant} in a finished game yet.`}
        </p>
        <Link to="/players" className="link-btn">← Back to Players</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2>{player.name}</h2>
        <span className="badge">{stats.gamesPlayed} games · {stats.handsPlayed} hands</span>
      </div>

      <VariantSelector value={variant} onChange={setVariant} includeAll />

      <div className="stat-grid">
        <MoneyTile label="Total Profit" cents={stats.totalProfit} />
        <div className="stat-tile">
          <div className="stat-label">Win Rate</div>
          <div className="stat-value">{formatPercent(stats.winRate)}</div>
        </div>
        <MoneyTile label="Avg / Game" cents={stats.avgProfitPerGame} />
        <MoneyTile label="Avg / Hand" cents={stats.avgProfitPerHand} />
        <div className="stat-tile">
          <div className="stat-label">Winning Games</div>
          <div className="stat-value">{stats.winningGames}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">Losing Games</div>
          <div className="stat-value">{stats.losingGames}</div>
        </div>
        <MoneyTile label="Best Game" cents={stats.bestGame?.amount ?? 0} dateInfo={stats.bestGame} />
        <MoneyTile label="Worst Game" cents={stats.worstGame?.amount ?? 0} dateInfo={stats.worstGame} />
        <MoneyTile label="Best Hand" cents={stats.bestHand?.amount ?? 0} dateInfo={stats.bestHand} />
        <MoneyTile label="Worst Hand" cents={stats.worstHand?.amount ?? 0} dateInfo={stats.worstHand} />
      </div>

      {breakdown && breakdown.breakdown.length > 0 && (
        <>
          <h3>By Variant</h3>
          {breakdown.breakdown.map((v) => (
            <div key={v.variant} className="results-row" style={{ padding: '10px 0' }}>
              <span className="player-label">
                {v.variant} <span className="stat-date" style={{ display: 'inline' }}>· {v.handsPlayed} hands</span>
              </span>
              <span className={`money ${v.totalProfit > 0 ? 'positive' : v.totalProfit < 0 ? 'negative' : 'zero'}`}>
                {formatMoney(v.totalProfit)}
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
