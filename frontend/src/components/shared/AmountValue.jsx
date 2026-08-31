import { MoneyDisplay } from './MoneyDisplay.jsx';
import { formatChips, centsToChips } from '../../api/client.js';

export function AmountValue({ cents, unit = 'cash', game }) {
  if (unit === 'chips' && game?.chips_amount) {
    const sign = cents > 0 ? 'positive' : cents < 0 ? 'negative' : 'zero';
    return <span className={`money ${sign}`}>{formatChips(centsToChips(cents, game))}</span>;
  }
  return <MoneyDisplay cents={cents} />;
}
