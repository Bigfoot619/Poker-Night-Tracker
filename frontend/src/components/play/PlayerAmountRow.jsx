import { PlayerAvatar } from '../shared/PlayerAvatar.jsx';
import { chipsToCents, centsToChips } from '../../api/client.js';

const CASH_STEPS = [
  { delta: -50, size: 'lg' },
  { delta: -20, size: 'md' },
  { delta: -10, size: 'sm' },
];
const CASH_STEPS_POSITIVE = [
  { delta: 10, size: 'sm' },
  { delta: 20, size: 'md' },
  { delta: 50, size: 'lg' },
];

const CHIP_STEPS = [
  { delta: -20, size: 'lg' },
  { delta: -10, size: 'md' },
  { delta: -5, size: 'sm' },
  { delta: -2, size: 'xs' },
];
const CHIP_STEPS_POSITIVE = [
  { delta: 2, size: 'xs' },
  { delta: 5, size: 'sm' },
  { delta: 10, size: 'md' },
  { delta: 20, size: 'lg' },
];

export function PlayerAmountRow({ player, value, onChange, unit = 'cash', game }) {
  const dollarsNumeric = Number(value) || 0;
  const cents = Math.round(dollarsNumeric * 100);
  const isChips = unit === 'chips' && game;

  const displayValue = isChips ? String(centsToChips(cents, game)) : value;
  const sign = dollarsNumeric > 0 ? 'positive' : dollarsNumeric < 0 ? 'negative' : '';

  const negativeSteps = isChips ? CHIP_STEPS : CASH_STEPS;
  const positiveSteps = isChips ? CHIP_STEPS_POSITIVE : CASH_STEPS_POSITIVE;

  const applyDollarsDelta = (deltaDollars) => onChange(String(dollarsNumeric + deltaDollars));

  const applyQuick = (delta) => {
    if (isChips) {
      applyDollarsDelta(chipsToCents(delta, game) / 100);
    } else {
      applyDollarsDelta(delta);
    }
  };

  const handleTyped = (raw) => {
    if (isChips) {
      const chips = Number(raw) || 0;
      onChange(String(chipsToCents(chips, game) / 100));
    } else {
      onChange(raw);
    }
  };

  return (
    <div className="player-row">
      <div className="player-name">
        <PlayerAvatar name={player.name} size={28} />
        {player.name}
      </div>
      <div className="controls">
        {negativeSteps.map(({ delta, size }) => (
          <button
            key={delta}
            type="button"
            className={`chip-btn negative size-${size}`}
            onClick={() => applyQuick(delta)}
            aria-label={`Subtract ${Math.abs(delta)} from ${player.name}`}
          >
            {delta}
          </button>
        ))}
        <input
          type="number"
          className={`amount-input ${sign}`}
          value={displayValue}
          step={isChips ? 1 : 'any'}
          onChange={(e) => handleTyped(e.target.value)}
          inputMode="decimal"
          aria-label={`${player.name} amount`}
        />
        {positiveSteps.map(({ delta, size }) => (
          <button
            key={delta}
            type="button"
            className={`chip-btn positive size-${size}`}
            onClick={() => applyQuick(delta)}
            aria-label={`Add ${delta} to ${player.name}`}
          >
            +{delta}
          </button>
        ))}
      </div>
    </div>
  );
}
