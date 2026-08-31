import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useCurrentGame } from '../hooks/useCurrentGame.js';
import { PlayerAmountRow } from '../components/play/PlayerAmountRow.jsx';
import { HandTotalBanner } from '../components/play/HandTotalBanner.jsx';
import { GameTotalsStrip } from '../components/play/GameTotalsStrip.jsx';
import { UndoConfirmModal } from '../components/play/UndoConfirmModal.jsx';
import { EndGameModal } from '../components/play/EndGameModal.jsx';
import { Button } from '../components/shared/Button.jsx';
import { UnitToggle } from '../components/shared/UnitToggle.jsx';
import { VariantSelector } from '../components/shared/VariantSelector.jsx';
import { useToast } from '../components/shared/ToastProvider.jsx';
import { saveHand, undoLastHand } from '../api/hands.js';
import { endGame } from '../api/games.js';
import { dollarsToCents, formatRatio } from '../api/client.js';
import { DEFAULT_VARIANT } from '../constants.js';

function zeroedAmounts(players) {
  const map = {};
  for (const p of players) map[p.id] = '0';
  return map;
}

export function PlayPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { game, loading, refresh } = useCurrentGame(location.state?.gameId);
  const showToast = useToast();

  const [amounts, setAmounts] = useState({});
  const [unit, setUnit] = useState('cash');
  const [variant, setVariant] = useState(DEFAULT_VARIANT);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showUndo, setShowUndo] = useState(false);
  const [undoing, setUndoing] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [ending, setEnding] = useState(false);

  useEffect(() => {
    if (game) setAmounts((prev) => (Object.keys(prev).length ? prev : zeroedAmounts(game.players)));
  }, [game]);

  const totalDollars = useMemo(
    () => Object.values(amounts).reduce((sum, v) => sum + (Number(v) || 0), 0),
    [amounts]
  );
  const balanced = Math.abs(totalDollars) < 0.001;

  if (loading) return <p>Loading...</p>;

  if (!game) {
    return (
      <div className="empty-state">
        <p>No game in progress.</p>
        <Link to="/new-game"><Button>Start New Game</Button></Link>
      </div>
    );
  }

  const handleAmountChange = (playerId, value) => {
    setAmounts((prev) => ({ ...prev, [playerId]: value }));
  };

  const handleSave = async () => {
    setError('');
    if (!balanced) return;
    setSaving(true);
    const savedHandNumber = game.handCount + 1;
    try {
      const results = game.players.map((p) => ({
        playerId: p.id,
        amount: dollarsToCents(amounts[p.id] || 0),
      }));
      await saveHand(game.id, results, variant);
      await refresh();
      setAmounts(zeroedAmounts(game.players));
      showToast(`Hand #${savedHandNumber} saved (${variant})`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUndo = async () => {
    setUndoing(true);
    try {
      const result = await undoLastHand(game.id);
      await refresh();
      setShowUndo(false);
      showToast(`Hand #${result.removedHandNumber} undone`);
    } catch (err) {
      setError(err.message);
    } finally {
      setUndoing(false);
    }
  };

  const handleEndGame = async () => {
    setEnding(true);
    try {
      await endGame(game.id);
      navigate(`/games/${game.id}`);
    } catch (err) {
      setError(err.message);
      setEnding(false);
    }
  };

  const ratioText = formatRatio(game);

  return (
    <div>
      <GameTotalsStrip totals={game.totals} unit={unit} game={game} />

      {ratioText && <span className="ratio-badge">{ratioText}</span>}

      <div className="hand-title">
        <span className="hand-label">{game.date}</span>
        HAND #{game.handCount + 1}
      </div>

      <VariantSelector value={variant} onChange={setVariant} />

      {ratioText && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <UnitToggle unit={unit} onChange={setUnit} />
        </div>
      )}

      {game.players.map((p) => (
        <PlayerAmountRow
          key={p.id}
          player={p}
          value={amounts[p.id] ?? '0'}
          onChange={(v) => handleAmountChange(p.id, v)}
          unit={unit}
          game={game}
        />
      ))}

      <HandTotalBanner totalDollars={totalDollars} unit={unit} game={game} />

      {error && <p className="error-text">{error}</p>}

      <Button className="btn-block" style={{ marginTop: 12 }} onClick={handleSave} disabled={!balanced || saving}>
        {saving ? 'Saving...' : 'SAVE HAND'}
      </Button>

      <div className="play-actions">
        <Button variant="secondary" onClick={() => setShowUndo(true)} disabled={game.handCount === 0}>
          Undo Last Hand
        </Button>
        <Button variant="danger" onClick={() => setShowEnd(true)}>
          End Game
        </Button>
      </div>

      {showUndo && (
        <UndoConfirmModal
          handNumber={game.handCount}
          confirming={undoing}
          onConfirm={handleUndo}
          onCancel={() => setShowUndo(false)}
        />
      )}

      {showEnd && (
        <EndGameModal
          game={game}
          confirming={ending}
          onConfirm={handleEndGame}
          onCancel={() => setShowEnd(false)}
        />
      )}
    </div>
  );
}
