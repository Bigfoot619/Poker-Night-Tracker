import { useMemo, useState } from 'react';
import { Modal } from '../shared/Modal.jsx';
import { Button } from '../shared/Button.jsx';
import { UnitToggle } from '../shared/UnitToggle.jsx';
import { VariantSelector } from '../shared/VariantSelector.jsx';
import { PlayerAmountRow } from '../play/PlayerAmountRow.jsx';
import { HandTotalBanner } from '../play/HandTotalBanner.jsx';
import { dollarsToCents, centsToDollars, formatRatio } from '../../api/client.js';
import { editHand } from '../../api/hands.js';

export function EditHandModal({ hand, players, game, onSaved, onCancel }) {
  const [amounts, setAmounts] = useState(() => {
    const map = {};
    for (const r of hand.results) map[r.playerId] = String(centsToDollars(r.amount));
    return map;
  });
  const [variant, setVariant] = useState(hand.variant);
  const [unit, setUnit] = useState('cash');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const totalDollars = useMemo(
    () => Object.values(amounts).reduce((sum, v) => sum + (Number(v) || 0), 0),
    [amounts]
  );
  const balanced = Math.abs(totalDollars) < 0.001;
  const ratioText = formatRatio(game);

  const handleSave = async () => {
    setError('');
    if (!balanced) return;
    setSaving(true);
    try {
      const results = players.map((p) => ({ playerId: p.id, amount: dollarsToCents(amounts[p.id] || 0) }));
      await editHand(hand.id, results, variant);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={`Edit Hand #${hand.handNumber}`} onClose={onCancel}>
      <VariantSelector value={variant} onChange={setVariant} />
      {ratioText && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <UnitToggle unit={unit} onChange={setUnit} />
        </div>
      )}
      {players.map((p) => (
        <PlayerAmountRow
          key={p.id}
          player={p}
          value={amounts[p.id] ?? '0'}
          onChange={(v) => setAmounts((prev) => ({ ...prev, [p.id]: v }))}
          unit={unit}
          game={game}
        />
      ))}
      <HandTotalBanner totalDollars={totalDollars} unit={unit} game={game} />
      {error && <p className="error-text">{error}</p>}
      <div className="play-actions">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSave} disabled={!balanced || saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </Modal>
  );
}
