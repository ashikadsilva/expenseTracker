import React, { useState, useMemo } from 'react';
import { IconPencil, IconTrash } from './actionIcons';
import { budgetMonthYearToIsoKey } from '../utils/monthKeys';

function formatMonthKey(iso) {
  const [y, m] = String(iso || '').split('-');
  if (!y || !m) return iso;
  const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
  return d.toLocaleString('en-IN', { month: 'short', year: 'numeric' });
}

function formatSignedAmount(isExpense, amount) {
  const n = Math.round(Number(amount) || 0);
  const abs = Math.abs(n).toLocaleString('en-IN');
  return (isExpense ? '-' : '+') + '₹' + abs;
}

const Transactions = ({
  transactions,
  accounts,
  getColor,
  fmt,
  getFiltered,
  getAllMonths,
  budgetData = [],
  openTxnModal,
  deleteTxn,
  getBalanceForMonth,
  calculateMonthlyBalances,
}) => {
  const [filters, setFilters] = useState({
    month: 'all',
    account: 'all',
    type: 'all',
    category: 'all',
    search: '',
  });

  /** Months from line-item txns and from budget/summary sheets so the list is never empty after Excel import. */
  const monthKeys = useMemo(() => {
    const fromTx = getAllMonths();
    const fromBudget = (budgetData || [])
      .map((b) => budgetMonthYearToIsoKey(b.month, b.year))
      .filter(Boolean);
    return [...new Set([...fromTx, ...fromBudget])].sort();
  }, [transactions, budgetData, getAllMonths]);

  const allCategories = useMemo(
    () => [...new Set(transactions.map((t) => t.cat))].sort(),
    [transactions]
  );

  const data = useMemo(() => {
    return [...getFiltered(filters)].sort((a, b) => b.date.localeCompare(a.date));
  }, [filters, getFiltered, transactions]);

  const totE = useMemo(() => data.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0), [data]);
  const totI = useMemo(() => data.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0), [data]);

  const emptyHint = useMemo(() => {
    if (data.length) return null;
    const iso = filters.month;
    const hasBudgetMonth =
      iso !== 'all' &&
      (budgetData || []).some((b) => {
        const k = budgetMonthYearToIsoKey(b.month, b.year);
        if (k !== iso) return false;
        if (filters.account !== 'all' && b.account !== filters.account) return false;
        return true;
      });
    if (transactions.length === 0) {
      if (hasBudgetMonth) {
        return {
          title: 'Budget for this month is loaded',
          body:
            'There are still no line-item transactions. This tab only lists rows from bank-style tabs (names including Transaction, Txn, Statement, Ledger, Passbook, or Entries). Summary tabs power Overview and Monthly Statement. Use + Add Entry or import a matching tab.',
        };
      }
      return {
        title: 'No transactions in your data yet',
        body:
          'Import an XLSX whose tab name includes Transaction, Txn, Statement, Ledger, Passbook, or Entries, or use + Add Entry. You do not need to pick a filter first — the table shows every saved row unless you narrow it below.',
      };
    }
    if (hasBudgetMonth) {
      return {
        title: 'Nothing in the table for these filters',
        body:
          'You may have budget for this month but no transactions dated in it, or filters are hiding rows. Try All months, All accounts, or clear search.',
      };
    }
    return {
      title: 'No transactions match these filters',
      body: 'Try another month or account, set type and category to All, or clear the search box. The list loads all rows by default.',
    };
  }, [data.length, transactions.length, budgetData, filters.month, filters.account, filters.type, filters.category, filters.search]);

  const balanceLine = useMemo(() => {
    if (filters.month !== 'all') {
      const b = getBalanceForMonth(filters.month, filters.account);
      const net = b.endBalance - b.startBalance;
      return { start: b.startBalance, end: b.endBalance, net };
    }
    const monthly = calculateMonthlyBalances(filters.account);
    const keys = Object.keys(monthly).sort();
    if (!keys.length) return { start: 0, end: 0, net: 0 };
    const first = monthly[keys[0]];
    const last = monthly[keys[keys.length - 1]];
    return {
      start: first.startBalance,
      end: last.endBalance,
      net: last.endBalance - first.startBalance,
    };
  }, [filters.month, filters.account, getBalanceForMonth, calculateMonthlyBalances, transactions]);

  const accountLabel = (id) => accounts.find((a) => a.id === id)?.label || id;

  return (
    <div className="section">
      <div className="filters txn-filters">
        <select
          className="filter-select"
          value={filters.month}
          onChange={(e) => setFilters((prev) => ({ ...prev, month: e.target.value }))}
        >
          <option value="all">All months</option>
          {monthKeys.map((m) => (
            <option key={m} value={m}>
              {formatMonthKey(m)}
            </option>
          ))}
        </select>
        <select
          className="filter-select"
          value={filters.account}
          onChange={(e) => setFilters((prev) => ({ ...prev, account: e.target.value }))}
        >
          <option value="all">All accounts</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>
        <select
          className="filter-select"
          value={filters.type}
          onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
        >
          <option value="all">All types</option>
          <option value="expense">Expenses</option>
          <option value="income">Income</option>
        </select>
        <select
          className="filter-select"
          value={filters.category}
          onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
        >
          <option value="all">All categories</option>
          {allCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <input
          type="search"
          className="txn-search"
          placeholder="Search..."
          value={filters.search}
          onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
          aria-label="Search transactions"
        />
      </div>
      <p className="txn-filter-hint">
        All saved transactions load by default. Use month, account, type, category, or search to narrow the list.
      </p>

      <div className="txn-metrics-grid">
        <div className="txn-metric-card">
          <div className="txn-metric-label">Expenses</div>
          <div className="txn-metric-val txn-metric-val--red">{fmt(totE)}</div>
        </div>
        <div className="txn-metric-card">
          <div className="txn-metric-label">Income</div>
          <div className="txn-metric-val txn-metric-val--green">{fmt(totI)}</div>
        </div>
        <div className="txn-metric-card">
          <div className="txn-metric-label">Count</div>
          <div className="txn-metric-val txn-metric-val--muted">{data.length}</div>
        </div>
        <div className="txn-metric-card">
          <div className="txn-metric-label">Start balance</div>
          <div
            className={`txn-metric-val ${
              balanceLine.start >= 0 ? 'txn-metric-val--green' : 'txn-metric-val--red'
            }`}
          >
            {fmt(balanceLine.start)}
          </div>
        </div>
        <div className="txn-metric-card">
          <div className="txn-metric-label">End balance</div>
          <div
            className={`txn-metric-val ${
              balanceLine.end >= 0 ? 'txn-metric-val--green' : 'txn-metric-val--red'
            }`}
          >
            {fmt(balanceLine.end)}
          </div>
        </div>
        <div className="txn-metric-card">
          <div className="txn-metric-label">Net change</div>
          <div
            className={`txn-metric-val ${
              balanceLine.net >= 0 ? 'txn-metric-val--green' : 'txn-metric-val--red'
            }`}
          >
            {balanceLine.net >= 0 ? '+' : '-'}
            {fmt(Math.abs(balanceLine.net))}
          </div>
        </div>
      </div>

      <div className="tbl-wrap txn-table-wrap">
        <div className="tbl-head txn-cols txn-table-head">
          <span>Date</span>
          <span>Description</span>
          <span>Category</span>
          <div className="txn-head-amt-actions">
            <span>Amount</span>
            <span>Actions</span>
          </div>
        </div>
        <div>
          {!data.length ? (
            <div className="empty txn-table-empty">
              <div style={{ fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                {emptyHint.title}
              </div>
              <div>{emptyHint.body}</div>
            </div>
          ) : (
            data.map((t) => {
              const col = getColor(t.cat);
              const isE = t.type === 'expense';
              return (
                <div key={t.id} className="tbl-row txn-cols txn-table-row">
                  <span className="txn-cell-date">{t.date}</span>
                  <span className="txn-cell-desc">
                    <span className="txn-desc-main">{t.desc || '—'}</span>
                    <span className="txn-desc-acct">{accountLabel(t.account)}</span>
                  </span>
                  <span className="txn-cell-cat">
                    <span
                      className="cat-badge txn-cat-pill"
                      style={{
                        background: `${col}26`,
                        color: col,
                        border: `0.5px solid ${col}44`,
                      }}
                    >
                      {t.cat}
                    </span>
                  </span>
                  <div className="txn-amt-actions">
                    <span
                      className={`txn-amt txn-amt-signed ${isE ? 'txn-amt--exp' : 'txn-amt--inc'}`}
                    >
                      {formatSignedAmount(isE, t.amount)}
                    </span>
                    <div className="txn-actions">
                      <button
                        type="button"
                        className="icon-btn"
                        aria-label="Edit transaction"
                        onClick={() => openTxnModal(t.id)}
                      >
                        <IconPencil />
                      </button>
                      <button
                        type="button"
                        className="icon-btn"
                        aria-label="Delete transaction"
                        onClick={() => deleteTxn(t.id)}
                      >
                        <IconTrash />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Transactions;
