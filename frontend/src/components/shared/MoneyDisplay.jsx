import { formatMoney } from '../../api/client.js';

export function MoneyDisplay({ cents, className = '' }) {
  const sign = cents > 0 ? 'positive' : cents < 0 ? 'negative' : 'zero';
  return <span className={`money ${sign} ${className}`}>{formatMoney(cents)}</span>;
}
