/** Bank / account values stored on each transaction and used in filters. */
export const ACCOUNTS = [
  { value: 'Canara', label: 'Canara Bank' },
  { value: 'Union', label: 'Union Bank' },
  { value: 'Other', label: 'HDFC Bank' },
];

export function getAccountLabel(value) {
  const row = ACCOUNTS.find((a) => a.value === value);
  return row ? row.label : value || 'Account';
}

/** Badge colors for account chips in lists */
export function getAccountBadgeStyle(account) {
  if (account === 'Canara') {
    return { backgroundColor: '#E6F1FB', color: '#0C447C' };
  }
  if (account === 'Union') {
    return { backgroundColor: '#E1F5EE', color: '#085041' };
  }
  return { backgroundColor: '#F5F0E6', color: '#5C4A27' };
}
