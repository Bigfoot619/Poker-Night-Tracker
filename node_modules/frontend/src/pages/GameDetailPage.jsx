import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getGame, getGameHands } from '../api/games.js';
import { AmountValue } from '../components/shared/AmountValue.jsx';
import { PlayerAvatar } from '../components/shared/PlayerAvatar.jsx';
import { UnitToggle } from '../components/shared/UnitToggle.jsx';
import { EditHandModal } from '../components/games/EditHandModal.jsx';
import { useToast } from '../components/shared/ToastProvider.jsx';
import { formatRatio } from '../api/client.js';

export function GameDetailPage() {
  const { id } = useParams();
  const [game, setGame] = useState(null);
  const [hands, setHands] = useState([]);
  const [editingHand, setEditingHand] = useState(null);
  const [unit, setUnit] = useState('cash');
  const showToast = useToast();

  const refresh = () => {
    getGame(Number(id)).then(setGame);
    getGameHands(Number(id)).then(setHands);
  };

  useEffect(() => { refresh(); }, [id]);

  if (!game) return <p>Loading...</p>;

  const playerName = (playerId) => game.players.find((p) => p.id === playerId)?.name ?? `#${playerId}`;
  const canEdit = game.status === 'in_progress';
  const ratioText = formatRatio(game);

  return (
    <div>
      <div className="page-header">
        <h2>{game.date}</h2>
        <span className="badge">{game.status === 'in_progress' ? 'In Progress' : 'Finished'}</span>
      </div>
      <p style={{ color: 'var(--cream-dim)', marginTop: -8 }}>
        {hands.length} hands · {game.players.length} players
        {ratioText && ` · ${ratioText}`}
      </p>

      {ratioText && (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0 14px' }}>
          <UnitToggle unit={unit} onChange={setUnit} />
        </div>
      )}

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Final Results</h3>
        {game.totals.map((t) => (
          <div key={t.playerId} className="results-row">
            <span className="player-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <PlayerAvatar name={t.name} size={26} />
              {t.name}
            </span>
            <AmountValue cents={t.amount} unit={unit} game={game} />
          </div>
        ))}
      </div>

      <h3>Hand History</h3>
      {hands.length === 0 && <p className="empty-state">No hands recorded.</p>}
      {[...hands].reverse().map((h) => (
        <div key={h.id} className="hand-history-card">
          <div className="hand-history-header">
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <strong>Hand #{h.handNumber}</strong>
              <span className="badge">{h.variant}</span>
            </span>
            {canEdit && (
              <button className="link-btn" onClick={() => setEditingHand(h)}>Edit</button>
            )}
          </div>
          {h.results.map((r) => (
            <div key={r.playerId} className="results-row">
              <span className="player-label">{playerName(r.playerId)}</span>
              <AmountValue cents={r.amount} unit={unit} game={game} />
            </div>
          ))}
        </div>
      ))}

      {editingHand && (
        <EditHandModal
          hand={editingHand}
          players={game.players}
          game={game}
          onCancel={() => setEditingHand(null)}
          onSaved={() => {
            const handNumber = editingHand.handNumber;
            setEditingHand(null);
            refresh();
            showToast(`Hand #${handNumber} updated`);
          }}
        />
      )}
    </div>
  );
}
