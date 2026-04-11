/** Canonical month keys use `YYYY-MM` (same as transaction `date` prefix). */

const ORDER = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Map budget sheet fields (`month` like "Mar", `year` like "2025") to `YYYY-MM`.
 * Returns null if month cannot be parsed.
 */
export function budgetMonthYearToIsoKey(monthStr, yearStr) {
  const y = parseInt(String(yearStr || '').trim(), 10);
  if (!Number.isFinite(y)) return null;
  const raw = String(monthStr || '').trim();
  if (!raw || /^unknown$/i.test(raw)) return null;
  const titled = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  let idx = ORDER.indexOf(titled);
  if (idx < 0 && raw.length >= 3) {
    const abbr = raw.charAt(0).toUpperCase() + raw.slice(1, 3).toLowerCase();
    idx = ORDER.indexOf(abbr);
  }
  if (idx < 0) return null;
  return `${y}-${String(idx + 1).padStart(2, '0')}`;
}
