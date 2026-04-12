import React, { useState, useEffect, useMemo } from 'react';
import { getAccountBadgeStyle } from '../utils/accounts';
import { budgetMonthYearToIsoKey } from '../utils/monthKeys';

const MONTH_ORDER = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const EXP_BAR_FALLBACK = '#185FA5';
const INC_BAR_FALLBACK = '#3B6D11';

const MonthlyStatement = ({ budgetData, accounts, getColor, viewMode, setViewMode }) => {
  const [stmtMonth, setStmtMonth] = useState('all');
  const [stmtAccount, setStmtAccount] = useState('all');

  useEffect(() => {
    if (viewMode === 'combined') setStmtAccount('all');
  }, [viewMode]);

  const monthOptions = useMemo(() => {
    if (!budgetData || !budgetData.length) return [];
    const keys = [...new Set(budgetData.map((d) => `${d.month} ${d.year}`))];
    keys.sort((a, b) => {
      const [ma, ya] = a.split(' ');
      const [mb, yb] = b.split(' ');
      if (ya !== yb) return parseInt(ya, 10) - parseInt(yb, 10);
      return MONTH_ORDER.indexOf(ma) - MONTH_ORDER.indexOf(mb);
    });
    return keys;
  }, [budgetData]);

  const formatMonthOptionLabel = (key) => {
    const last = key.lastIndexOf(' ');
    if (last <= 0) return key;
    const mPart = key.slice(0, last).trim();
    const yPart = key.slice(last + 1).trim();
    const iso = budgetMonthYearToIsoKey(mPart, yPart);
    if (iso) {
      const [y, mo] = iso.split('-');
      const d = new Date(parseInt(y, 10), parseInt(mo, 10) - 1, 1);
      return d.toLocaleString('en-IN', { month: 'short', year: 'numeric' });
    }
    return key;
  };
  const fmt = (n) => {
    if (n === null || n === undefined) return '₹';
    return '₹' + Math.abs(Math.round(n)).toLocaleString('en-IN');
  };

  const fmtSigned = (n) => {
    if (n === null || n === undefined) return '₹';
    const sign = n >= 0 ? '+' : '-';
    return sign + '₹' + Math.abs(Math.round(n)).toLocaleString('en-IN');
  };

  const getFilteredBudgetData = () => {
    if (!budgetData || budgetData.length === 0) return [];
    
    if (viewMode === 'combined') {
      // Combine data by month
      const combined = {};
      
      budgetData.forEach(item => {
        const monthKey = `${item.month} ${item.year}`;
        if (!combined[monthKey]) {
          combined[monthKey] = {
            month: item.month,
            year: item.year,
            sheets: [],
            combinedStartBalance: 0,
            combinedEndBalance: 0,
            combinedIncome: 0,
            combinedExpenses: 0,
            combinedNetSavings: 0,
            combinedSavedThisMonth: 0,
            combinedIssues: [],
            combinedCategories: { expense: {}, income: {} }
          };
        }
        
        const monthData = combined[monthKey];
        monthData.sheets.push(item);
        monthData.combinedStartBalance += item.start_balance || 0;
        monthData.combinedEndBalance += item.end_balance || 0;
        monthData.combinedIncome += item.total_income_actual || 0;
        monthData.combinedExpenses += item.total_expenses_actual || 0;
        monthData.combinedNetSavings += (item.net_savings || 0);
        monthData.combinedSavedThisMonth =
          (monthData.combinedSavedThisMonth || 0) + (Number(item.saved_this_month) || 0);
        
        // Combine issues from all sheets
        if (item.issues && item.issues.length > 0) {
          monthData.combinedIssues.push(...item.issues);
        }
        
        // Combine expense categories
        (item.expense_categories || []).forEach(cat => {
          if (!monthData.combinedCategories.expense[cat.category]) {
            monthData.combinedCategories.expense[cat.category] = { planned: 0, actual: 0, diff: 0 };
          }
          monthData.combinedCategories.expense[cat.category].planned += Number(cat.planned) || 0;
          monthData.combinedCategories.expense[cat.category].actual += Number(cat.actual) || 0;
          monthData.combinedCategories.expense[cat.category].diff += Number(cat.diff) || 0;
        });
        
        // Combine income categories
        (item.income_categories || []).forEach(cat => {
          if (!monthData.combinedCategories.income[cat.category]) {
            monthData.combinedCategories.income[cat.category] = { planned: 0, actual: 0, diff: 0 };
          }
          monthData.combinedCategories.income[cat.category].planned += Number(cat.planned) || 0;
          monthData.combinedCategories.income[cat.category].actual += Number(cat.actual) || 0;
          monthData.combinedCategories.income[cat.category].diff += Number(cat.diff) || 0;
        });
      });
      
      return Object.values(combined);
    } else {
      // Return individual sheets
      return budgetData;
    }
  };

  const resolveStatementCategories = (item, isCombined, kind) => {
    const mapCombined = (path) =>
      Object.entries((item.combinedCategories && item.combinedCategories[path]) || {}).map(([category, data]) => ({
        category,
        planned: Number(data?.planned) || 0,
        actual: Number(data?.actual) || 0,
        diff: Number(data?.diff) || 0,
      }));

    const expList =
      item.expense_categories ||
      item.expenseCategories ||
      (Array.isArray(item.expense_category_rows) ? item.expense_category_rows : null) ||
      [];
    const incList =
      item.income_categories ||
      item.incomeCategories ||
      (Array.isArray(item.income_category_rows) ? item.income_category_rows : null) ||
      [];

    const fromSheetRaw =
      kind === 'expense'
        ? isCombined
          ? mapCombined('expense')
          : expList
        : isCombined
          ? mapCombined('income')
          : incList;

    return fromSheetRaw.map((c) => {
      const planned = Number(c.planned) || 0;
      const actual = Number(c.actual) || 0;
      const diffRaw = c.diff;
      const diff =
        diffRaw != null && Number.isFinite(Number(diffRaw))
          ? Number(diffRaw)
          : actual - planned;
      return { category: c.category, planned, actual, diff };
    });
  };

  const barColorForCategory = (categoryName, kind) => {
    if (typeof getColor === 'function') {
      try {
        const c = getColor(categoryName);
        if (c && typeof c === 'string' && /^#/.test(c)) return c;
      } catch {
        /* ignore */
      }
    }
    return kind === 'expense' ? EXP_BAR_FALLBACK : INC_BAR_FALLBACK;
  };

  const renderStatementCard = (item, isCombined = false) => {
    const startBalance = isCombined ? item.combinedStartBalance : (item.start_balance || 0);
    const endBalance = isCombined ? item.combinedEndBalance : (item.end_balance || 0);
    const totalIncome = isCombined ? item.combinedIncome : (item.total_income_actual || 0);
    const totalExpenses = isCombined ? item.combinedExpenses : (item.total_expenses_actual || 0);
    const netSavings = isCombined ? item.combinedNetSavings : (item.net_savings || 0);
    const calculatedEndBalance = startBalance + netSavings;
    const balanceVariance = endBalance - calculatedEndBalance;
    const isBalanceConsistent = Math.abs(balanceVariance) < 0.01;
    const issues = isCombined ? (item.combinedIssues || []) : (item.issues || []);

    const expenseCategories = resolveStatementCategories(item, isCombined, 'expense');
    const incomeCategories = resolveStatementCategories(item, isCombined, 'income');

    const flow = endBalance - startBalance;
    const combinedPositive = flow >= 0;
    const indFlow = item.saved_this_month ?? flow;
    const indPositive = indFlow >= 0;
    const rawSavingsLabel = String(item.savings_label || '').trim();
    const savingsPillTextIndividual =
      rawSavingsLabel && (/₹|Rs\.?|INR/i.test(rawSavingsLabel) || rawSavingsLabel.length > 55)
        ? rawSavingsLabel
        : `${rawSavingsLabel || (indPositive ? 'Increase in total savings' : 'Decrease in total savings')}: ${fmtSigned(indFlow)}`;
    const combinedSaved = isCombined ? Number(item.combinedSavedThisMonth) || 0 : 0;
    const combinedSavedPositive = combinedSaved >= 0;
    const savingsPill = isCombined ? (
      <span
        className={`stmt-savings-pill ${combinedSavedPositive ? 'stmt-savings-pill--up' : 'stmt-savings-pill--down'}`}
      >
        {combinedSavedPositive ? 'Increase in total savings' : 'Decrease in total savings'}: {fmtSigned(combinedSaved)}
      </span>
    ) : (
      <span className={`stmt-savings-pill ${indPositive ? 'stmt-savings-pill--up' : 'stmt-savings-pill--down'}`}>
        {savingsPillTextIndividual}
      </span>
    );

    const renderBarColumn = (rows, kind) => {
      const filtered = rows
        .filter((cat) => Number(cat.actual) > 0)
        .sort((a, b) => Number(b.actual) - Number(a.actual));
      const max = Math.max(...filtered.map((c) => Number(c.actual)), 1);
      if (!filtered.length) {
        return (
          <div className="empty stmt-cat-empty">
            {kind === 'expense' ? 'No expense categories for this period.' : 'No income categories for this period.'}
          </div>
        );
      }
      return filtered.map((cat) => {
        const w = (Number(cat.actual) / max) * 100;
        const barColor = barColorForCategory(cat.category, kind);
        return (
          <div key={cat.category} className="stmt-cat-row stmt-cat-row--ref">
            <span className="stmt-cat-name" title={cat.category}>
              {cat.category}
            </span>
            <div className="stmt-bar-track">
              <div className="stmt-bar-fill" style={{ width: `${w}%`, background: barColor }} />
            </div>
            <div className="stmt-cat-amt-wrap">
              <div className={`stmt-cat-amt ${kind === 'expense' ? 'stmt-cat-amt--exp' : 'stmt-cat-amt--inc'}`}>
                {fmt(cat.actual)}
              </div>
            </div>
          </div>
        );
      });
    };

    const endUp = endBalance >= startBalance;

    return (
      <div
        key={isCombined ? `${item.month}-${item.year}` : item.sheet}
        className="stmt-card"
        title={!isCombined ? item.sheet : undefined}
      >
        <div className="stmt-head">
          <div className="stmt-head-left stmt-head-left--ref">
            <span className="stmt-month-label">{`${item.month} ${item.year}`}</span>
            {!isCombined && (
              <span
                className="stmt-acct-badge"
                style={{
                  padding: '4px 12px',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: '600',
                  ...getAccountBadgeStyle(item.account, accounts),
                }}
              >
                {item.account}
              </span>
            )}
            {isCombined && (
              <span
                className="stmt-acct-badge"
                style={{
                  padding: '4px 12px',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: '600',
                  background: '#E8F1FB',
                  color: '#185FA5',
                }}
              >
                Combined by month
              </span>
            )}
          </div>
          {savingsPill}
        </div>

        <div className="stmt-metrics">
          <div className="stmt-metric">
            <div className="stmt-metric-label">Start balance</div>
            <div className="stmt-metric-val stmt-metric-val--blue">{fmt(startBalance)}</div>
          </div>
          <div className="stmt-metric">
            <div className="stmt-metric-label">End balance</div>
            <div className={`stmt-metric-val ${endUp ? 'stmt-metric-val--green' : 'stmt-metric-val--red'}`}>
              {fmt(endBalance)}
            </div>
          </div>
          <div className="stmt-metric">
            <div className="stmt-metric-label">Total spent</div>
            <div className="stmt-metric-val stmt-metric-val--red">{fmt(totalExpenses)}</div>
          </div>
          <div className="stmt-metric">
            <div className="stmt-metric-label">Total income</div>
            <div className="stmt-metric-val stmt-metric-val--green">{fmt(totalIncome)}</div>
          </div>
        </div>

        {issues && issues.length > 0 && (
          <div className="stmt-panel stmt-panel--warn">
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#8a5a00', marginBottom: '8px' }}>
              Budget analysis issues
            </div>
            <div style={{ fontSize: '11px', color: '#5c4a00' }}>
              {issues.map((issue, index) => (
                <div key={index} style={{ marginBottom: '4px' }}>
                  <strong>{issue.type.replace('_', ' ').toUpperCase()}:</strong> {issue.message}
                </div>
              ))}
            </div>
          </div>
        )}

        {!isBalanceConsistent && (
          <div className="stmt-panel stmt-panel--info">
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#185FA5', marginBottom: '8px' }}>
              Balance consistency check
            </div>
            <div style={{ fontSize: '11px', color: '#2c5282' }}>
              <div style={{ marginBottom: '4px' }}>
                <strong>Start balance:</strong> {fmt(startBalance)}
              </div>
              <div style={{ marginBottom: '4px' }}>
                <strong>Net savings:</strong> {fmt(netSavings)}
              </div>
              <div style={{ marginBottom: '4px' }}>
                <strong>Calculated end balance:</strong> {fmt(calculatedEndBalance)}
              </div>
              <div style={{ marginBottom: '4px' }}>
                <strong>Actual end balance:</strong> {fmt(endBalance)}
              </div>
              <div style={{ marginBottom: '4px' }}>
                <strong>Variance:</strong>{' '}
                <span style={{ color: Math.abs(balanceVariance) < 0.01 ? '#3B6D11' : '#A32D2D' }}>
                  {fmtSigned(balanceVariance)}
                </span>
              </div>
              <div style={{ fontSize: '10px', marginTop: '8px' }}>
                {Math.abs(balanceVariance) < 0.01 ? 'Balance matches.' : 'Variance detected — review sheet vs. categories.'}
              </div>
            </div>
          </div>
        )}

        <div className="stmt-split">
          <div>
            <div className="stmt-col-title">Expenses</div>
            {renderBarColumn(expenseCategories, 'expense')}
          </div>
          <div>
            <div className="stmt-col-title">Income</div>
            {renderBarColumn(incomeCategories, 'income')}
          </div>
        </div>
      </div>
    );
  };

  const baseStatementData = getFilteredBudgetData();
  const stmtFiltersActive = stmtMonth !== 'all' || stmtAccount !== 'all';

  const displayStatementData = (() => {
    if (!stmtFiltersActive) return [];
    return baseStatementData.filter((item) => {
      const key = `${item.month} ${item.year}`;
      const monthOk = stmtMonth === 'all' || key === stmtMonth;
      if (viewMode === 'combined') return monthOk;
      const accOk = stmtAccount === 'all' || item.account === stmtAccount;
      return monthOk && accOk;
    });
  })();

  return (
    <div className="section">
      {/* View Toggle */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem'
      }}>
        <div style={{
          fontSize: '12px',
          fontWeight: '500',
          color: 'var(--color-text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.4px'
        }}>
          Monthly Statements
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setViewMode('individual')}
            style={{
              padding: '6px 12px',
              border: viewMode === 'individual' ? '0.5px solid #185FA5' : '0.5px solid var(--color-border-secondary)',
              borderRadius: '8px',
              fontSize: '12px',
              cursor: 'pointer',
              backgroundColor: viewMode === 'individual' ? '#185FA5' : 'var(--color-background-primary)',
              color: viewMode === 'individual' ? 'white' : 'var(--color-text-primary)'
            }}
          >
            Per sheet
          </button>
          <button
            onClick={() => setViewMode('combined')}
            style={{
              padding: '6px 12px',
              border: viewMode === 'combined' ? '0.5px solid #185FA5' : '0.5px solid var(--color-border-secondary)',
              borderRadius: '8px',
              fontSize: '12px',
              cursor: 'pointer',
              backgroundColor: viewMode === 'combined' ? '#185FA5' : 'var(--color-background-primary)',
              color: viewMode === 'combined' ? 'white' : 'var(--color-text-primary)'
            }}
          >
            Combined by month
          </button>
        </div>
      </div>

      {budgetData && budgetData.length > 0 && (
        <div className="filters" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
          <select
            className="filter-select"
            value={stmtMonth}
            onChange={(e) => setStmtMonth(e.target.value)}
          >
            <option value="all">All months</option>
            {monthOptions.map((m) => (
              <option key={m} value={m}>
                {formatMonthOptionLabel(m)}
              </option>
            ))}
          </select>
          <select
            className="filter-select"
            value={stmtAccount}
            onChange={(e) => setStmtAccount(e.target.value)}
            disabled={viewMode === 'combined'}
            title={viewMode === 'combined' ? 'Account filter is available in Per sheet view' : undefined}
            style={viewMode === 'combined' ? { opacity: 0.55, cursor: 'not-allowed' } : undefined}
          >
            <option value="all">All accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.label}</option>
            ))}
          </select>
        </div>
      )}

      {!budgetData || budgetData.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            color: 'var(--color-text-secondary)',
            fontSize: '14px',
            maxWidth: '520px'
          }}>
            No budget data available. Upload an Excel file to see statements.
          </div>
        </div>
      ) : !stmtFiltersActive ? (
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <div
            style={{
              marginTop: '0.5rem',
              padding: '1.25rem 1rem',
              borderRadius: '12px',
              border: '0.5px solid var(--color-border-tertiary)',
              background: 'var(--color-background-secondary)',
              textAlign: 'center',
              maxWidth: '520px',
              lineHeight: 1.5,
              color: 'var(--color-text-secondary)',
              fontSize: '13px'
            }}
          >
            <div style={{ fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '6px' }}>
              Choose what to view
            </div>
            Pick a <strong>month</strong> (e.g. Aug 2025) to see one card per bank, or narrow by <strong>account</strong> in
            Per sheet view. Combined by month merges all accounts for that month into a single card.
          </div>
        </div>
      ) : displayStatementData.length > 0 ? (
        displayStatementData.map((item) => renderStatementCard(item, viewMode === 'combined'))
      ) : (
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            color: 'var(--color-text-secondary)',
            fontSize: '14px',
            maxWidth: '520px'
          }}>
            No statements match these filters. Try a different month or account.
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyStatement;
