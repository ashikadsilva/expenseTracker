/** @typedef {{ id: string, label: string, keywords: string[], chipColor: string }} BankAccount */

export const DEFAULT_ACCOUNTS = [
  {
    id: 'Canara',
    label: 'Canara Bank',
    keywords: ['canara'],
    chipColor: '#0C447C',
  },
  {
    id: 'Union',
    label: 'Union Bank',
    keywords: ['union'],
    chipColor: '#085041',
  },
  {
    id: 'Other',
    label: 'HDFC Bank',
    keywords: ['other', 'hdfc'],
    chipColor: '#5C4A27',
  },
];

function slugify(s) {
  const t = String(s || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_-]/g, '');
  return t.slice(0, 40) || 'account';
}

function normalizeKeywordList(keywords, id) {
  if (Array.isArray(keywords)) {
    return keywords
      .map((k) => String(k).toLowerCase().trim())
      .filter(Boolean);
  }
  if (typeof keywords === 'string') {
    return keywords
      .split(',')
      .map((s) => s.toLowerCase().trim())
      .filter(Boolean);
  }
  return [String(id).toLowerCase()];
}

/**
 * @param {unknown} raw
 * @returns {BankAccount[]}
 */
export function normalizeAccounts(raw) {
  if (!Array.isArray(raw) || raw.length === 0) {
    return DEFAULT_ACCOUNTS.map((a) => ({
      id: a.id,
      label: a.label,
      keywords: [...a.keywords],
      chipColor: a.chipColor,
    }));
  }
  const out = [];
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue;
    const id = String(row.id || row.value || '')
      .trim()
      .slice(0, 40);
    if (!id) continue;
    const label = String(row.label || id).trim() || id;
    const chipColor =
      typeof row.chipColor === 'string' && /^#/.test(row.chipColor)
        ? row.chipColor
        : '#5C4A27';
    out.push({
      id,
      label,
      keywords: normalizeKeywordList(row.keywords, id),
      chipColor,
    });
  }
  return out.length ? out : normalizeAccounts(null);
}

function hexToRgba(hex, alpha) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return `rgba(92, 74, 39, ${alpha})`;
  return `rgba(${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(
    m[3],
    16
  )},${alpha})`;
}

/** @param {string} accountId */
export function getAccountBadgeStyle(accountId, accounts) {
  const row = normalizeAccounts(accounts).find((a) => a.id === accountId);
  const color = row?.chipColor || '#333';
  return { backgroundColor: hexToRgba(color, 0.14), color };
}

export function getAccountLabel(id, accounts) {
  const row = normalizeAccounts(accounts).find((a) => a.id === id);
  return row ? row.label : id || 'Account';
}

/**
 * Pick account id from Excel sheet name using keyword substring match (longest keyword wins).
 * @param {string} sheetName
 * @param {unknown} accounts
 */
export function matchAccountFromSheetName(sheetName, accounts) {
  const sl = String(sheetName).toLowerCase();
  const list = normalizeAccounts(accounts);
  const hits = [];
  for (const a of list) {
    for (const kw of a.keywords) {
      if (!kw) continue;
      if (sl.includes(kw)) hits.push({ id: a.id, len: kw.length });
    }
  }
  if (!hits.length) return 'Unknown';
  hits.sort((x, y) => y.len - x.len);
  return hits[0].id;
}

export function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Strip account-related words before parsing month in sheet titles.
 * @param {string} sheetName
 * @param {unknown} accounts
 */
export function stripAccountNoiseFromSheetName(sheetName, accounts) {
  const list = normalizeAccounts(accounts);
  const noise = new Set([
    'summary',
    'transactions',
    'transaction',
    'account',
    'bank',
  ]);
  list.forEach((a) => {
    noise.add(a.id.toLowerCase());
    a.keywords.forEach((k) => noise.add(k.toLowerCase()));
  });
  const parts = [...noise].filter(Boolean).map(escapeRegExp);
  if (!parts.length) return String(sheetName).toLowerCase();
  const re = new RegExp(`\\b(${parts.join('|')})\\b`, 'gi');
  return String(sheetName).toLowerCase().replace(re, ' ');
}

export function defaultAccountId(accounts) {
  const list = normalizeAccounts(accounts);
  return list[0]?.id || 'Unknown';
}

export { slugify };
