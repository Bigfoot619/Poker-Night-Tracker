async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
};

export const CURRENCY_SYMBOL = '₪';

export const dollarsToCents = (dollars) => Math.round(Number(dollars) * 100);
export const centsToDollars = (cents) => cents / 100;

export const formatMoney = (cents) => {
  const amount = cents / 100;
  const abs = Math.abs(amount).toFixed(2);
  if (amount > 0) return `+${CURRENCY_SYMBOL}${abs}`;
  if (amount < 0) return `-${CURRENCY_SYMBOL}${abs}`;
  return `${CURRENCY_SYMBOL}0.00`;
};

// Same as formatMoney but without the leading "+" for positive amounts —
// used on the Play screen's live total, where the sign is redundant next to the balance color.
export const formatMoneyPlain = (cents) => {
  const amount = cents / 100;
  const abs = Math.abs(amount).toFixed(2);
  return amount < 0 ? `-${CURRENCY_SYMBOL}${abs}` : `${CURRENCY_SYMBOL}${abs}`;
};

export const formatPercent = (ratio) => `${(ratio * 100).toFixed(1)}%`;

// --- Chips & Cash ratio helpers ---
// Every game stores its own chips_amount / cash_amount_cents (e.g. "100 chips = ₪20").
// Money is always the source of truth in cents; chip counts are a derived display convenience.

export function centsPerChip(game) {
  if (!game?.chips_amount || !game?.cash_amount_cents) return null;
  return game.cash_amount_cents / game.chips_amount;
}

export function centsToChips(cents, game) {
  const rate = centsPerChip(game);
  if (!rate) return 0;
  return Math.round(cents / rate);
}

export function chipsToCents(chips, game) {
  const rate = centsPerChip(game);
  if (!rate) return 0;
  return Math.round(Number(chips) * rate);
}

export function formatChips(chips) {
  const sign = chips > 0 ? '+' : '';
  return `${sign}${chips} chips`;
}

export function formatRatio(game) {
  if (!game?.chips_amount || !game?.cash_amount_cents) return null;
  const cash = (game.cash_amount_cents / 100).toFixed(2).replace(/\.00$/, '');
  return `${game.chips_amount} chips = ${CURRENCY_SYMBOL}${cash}`;
}
