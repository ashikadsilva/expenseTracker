const MONTH_ABBR = {
  Jan: 1,
  Feb: 2,
  Mar: 3,
  Apr: 4,
  May: 5,
  Jun: 6,
  Jul: 7,
  Aug: 8,
  Sep: 9,
  Oct: 10,
  Nov: 11,
  Dec: 12,
};

function monthYearPrefix(monthStr, yearStr) {
  const m = MONTH_ABBR[monthStr];
  const y = parseInt(String(yearStr), 10);
  if (!m || !Number.isFinite(y)) return null;
  return `${y}-${String(m).padStart(2, '0')}`;
}

/**
 * Build category rows from saved transactions for a statement month (and optional bank).
 * Used when budget sheet arrays are missing but totals exist (e.g. older cloud saves).
 */
export function buildCategoryRowsFromTransactions(transactions, monthStr, yearStr, account, type) {
  if (!Array.isArray(transactions) || !transactions.length) return [];
  const prefix = monthYearPrefix(monthStr, yearStr);
  if (!prefix) return [];

  const map = {};
  for (const t of transactions) {
    if (!t || typeof t.date !== 'string' || !t.date.startsWith(prefix)) continue;
    if (account && account !== 'all' && t.account !== account) continue;
    if (t.type !== type) continue;
    const amt = Number(t.amount);
    if (!Number.isFinite(amt) || amt <= 0) continue;
    const name = (t.cat && String(t.cat).trim()) || 'Other';
    map[name] = (map[name] || 0) + amt;
  }

  return Object.entries(map)
    .map(([category, actual]) => ({
      category,
      planned: 0,
      actual,
      diff: actual,
    }))
    .sort((a, b) => b.actual - a.actual);
}
