import { PlayerAvatar } from '../shared/PlayerAvatar.jsx';
import { AmountValue } from '../shared/AmountValue.jsx';

export function GameTotalsStrip({ totals, unit = 'cash', game }) {
  return (
    <div className="totals-strip">
      {totals.map((t) => (
        <div key={t.playerId} className="totals-strip-item">
          <PlayerAvatar name={t.name} size={26} />
          <span className="totals-strip-name">{t.name}</span>
          <AmountValue cents={t.amount} unit={unit} game={game} />
        </div>
      ))}
    </div>
  );
}
