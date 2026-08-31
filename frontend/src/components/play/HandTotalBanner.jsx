import { formatMoneyPlain, centsToChips } from '../../api/client.js';

export function HandTotalBanner({ totalDollars, unit = 'cash', game }) {
  const balanced = Math.abs(totalDollars) < 0.001;
  const totalCents = Math.round(totalDollars * 100);
  const display = unit === 'chips' && game
    ? `${centsToChips(totalCents, game)} chips`
    : formatMoneyPlain(totalCents);

  return (
    <div className={`total-banner ${balanced ? 'balanced' : 'unbalanced'}`}>
      <span className="total-label">Current Total</span>
      {display} {balanced ? '✓' : ''}
    </div>
  );
}
