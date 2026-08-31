import { useState } from 'react';
import { Modal } from '../shared/Modal.jsx';
import { Button } from '../shared/Button.jsx';
import { AmountValue } from '../shared/AmountValue.jsx';
import { UnitToggle } from '../shared/UnitToggle.jsx';
import { formatRatio } from '../../api/client.js';

export function EndGameModal({ game, onConfirm, onCancel, confirming }) {
  const [unit, setUnit] = useState('cash');
  const ratioText = formatRatio(game);

  return (
    <Modal title="Final Results" onClose={onCancel}>
      {ratioText && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <UnitToggle unit={unit} onChange={setUnit} />
        </div>
      )}
      {game.totals.map((t) => (
        <div key={t.playerId} className="results-row">
          <span className="player-label">{t.name}</span>
          <AmountValue cents={t.amount} unit={unit} game={game} />
        </div>
      ))}
      <p>Hands Played: {game.handCount}</p>
      <div className="play-actions">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm} disabled={confirming}>
          {confirming ? 'Ending...' : 'Confirm End Game'}
        </Button>
      </div>
    </Modal>
  );
}
