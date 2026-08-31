import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listPlayers } from '../api/players.js';
import { createGame } from '../api/games.js';
import { Button } from '../components/shared/Button.jsx';
import { CURRENCY_SYMBOL, dollarsToCents } from '../api/client.js';

export function NewGamePage() {
  const [players, setPlayers] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [chips, setChips] = useState('100');
  const [cash, setCash] = useState('20');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { listPlayers().then(setPlayers); }, []);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const ratioText = useMemo(() => {
    const chipsNum = Number(chips);
    const cashNum = Number(cash);
    if (!chipsNum || !cashNum) return null;
    const perChip = (cashNum * 100) / chipsNum;
    return `1 chip = ${CURRENCY_SYMBOL}${(perChip / 100).toFixed(2)}`;
  }, [chips, cash]);

  const handleStart = async () => {
    setError('');
    setSubmitting(true);
    try {
      const game = await createGame(
        date,
        Array.from(selected),
        Math.trunc(Number(chips)),
        dollarsToCents(cash)
      );
      navigate('/play', { state: { gameId: game.id } });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const chipsValid = Number.isInteger(Number(chips)) && Number(chips) > 0;
  const cashValid = Number(cash) > 0;

  return (
    <div>
      <h2>New Game</h2>
      <div className="card">
        <div className="field">
          <label htmlFor="game-date">Date</label>
          <input id="game-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      <h3>Chips &amp; Cash</h3>
      <div className="card">
        <p style={{ marginTop: 0, color: 'var(--cream-dim)', fontSize: '0.85rem' }}>
          Set the buy-in ratio for tonight's game — e.g. 100 chips for ₪20. Every amount entered
          during play can then be shown as chips or cash.
        </p>
        <div className="inline-form">
          <div className="field">
            <label htmlFor="chips-amount">Chips</label>
            <input
              id="chips-amount"
              type="number"
              min="1"
              step="1"
              value={chips}
              onChange={(e) => setChips(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="cash-amount">Cash ({CURRENCY_SYMBOL})</label>
            <input
              id="cash-amount"
              type="number"
              min="0.01"
              step="0.01"
              value={cash}
              onChange={(e) => setCash(e.target.value)}
            />
          </div>
        </div>
        {ratioText && <p className="badge" style={{ marginTop: 10 }}>{ratioText}</p>}
      </div>

      <h3>Select Players</h3>
      {players.length === 0 && <p className="empty-state">No players yet — add some on the Players tab first.</p>}
      {players.map((p) => (
        <label key={p.id} className="checkbox-row">
          <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} />
          {p.name}
        </label>
      ))}

      {error && <p className="error-text">{error}</p>}

      <Button
        className="btn-block"
        onClick={handleStart}
        disabled={selected.size < 2 || !chipsValid || !cashValid || submitting}
      >
        {submitting ? 'Starting...' : 'Start Game'}
      </Button>
      {selected.size < 2 && <p className="empty-state" style={{ padding: '10px 0' }}>Select at least 2 players.</p>}
    </div>
  );
}
