import React, { useState, useMemo, useCallback, useId } from 'react';
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  ReferenceLine,
} from 'recharts';
import { getAccountBadgeStyle } from '../utils/accounts';
import { budgetMonthYearToIsoKey } from '../utils/monthKeys';

const monthLabels = {
  '2025-08': 'Aug 2025', '2025-09': 'Sep 2025', '2025-10': 'Oct 2025', '2025-11': 'Nov 2025',
  '2025-12': 'Dec 2025', '2026-01': 'Jan 2026', '2026-02': 'Feb 2026', '2026-03': 'Mar 2026', '2026-04': 'Apr 2026',
  '2026-05': 'May 2026', '2026-06': 'Jun 2026', '2026-07': 'Jul 2026', '2026-08': 'Aug 2026', '2026-09': 'Sep 2026',
  '2026-10': 'Oct 2026', '2026-11': 'Nov 2026', '2026-12': 'Dec 2026'
};

function formatMonthKey(key) {
  if (monthLabels[key]) return monthLabels[key];
  const [y, m] = key.split('-');
  if (!y || !m) return key;
  const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
  return d.toLocaleString('en-IN', { month: 'short', year: 'numeric' });
}

/** Dashboard chart palette (matches reference cards). */
const CHART_COL = {
  expense: '#d98880',
  income: '#82ad8d',
  balance: '#2e5a88',
};

/** Sum expense category amounts from budget rows (individual or combined-with-sheets). */
function aggregateExpenseCategoriesFromBudgetRows(rows, viewMode) {
    const catMap = {};
  const addFromItem = (item) => {
    for (const c of item.expense_categories || []) {
      const name = (c.category || '').trim() || 'Other';
      catMap[name] = (catMap[name] || 0) + (Number(c.actual) || 0);
    }
  };
  for (const row of rows) {
    if (viewMode === 'combined' && Array.isArray(row.sheets) && row.sheets.length) {
      row.sheets.forEach(addFromItem);
    } else {
      addFromItem(row);
    }
  }
  return catMap;
}

const Dashboard = ({ transactions, categories, accounts, getColor, fmt, getFiltered, getAllMonths, calculateMonthlyBalances, getBalanceForMonth, budgetData, viewMode, setViewMode }) => {
  const [filters, setFilters] = useState({ month: 'all', account: 'all' });

  const getFilteredBudgetData = useCallback(() => {
    if (!budgetData || budgetData.length === 0) return [];
    
    if (viewMode === 'combined') {
      const combined = {};
      
      budgetData.forEach((item) => {
        const monthKey = `${item.month} ${item.year}`;
        if (!combined[monthKey]) {
          combined[monthKey] = {
            month: item.month,
            year: item.year,
            sheets: [],
            combinedStartBalance: 0,
            combinedEndBalance: 0,
            combinedIncome: 0,
            combinedExpenses: 0
          };
        }
        
        const monthData = combined[monthKey];
        monthData.sheets.push(item);
        monthData.combinedStartBalance += item.start_balance || 0;
        monthData.combinedEndBalance += item.end_balance || 0;
        monthData.combinedIncome += item.total_income_actual || 0;
        monthData.combinedExpenses += item.total_expenses_actual || 0;
      });
      
      return Object.values(combined);
    }
    return budgetData;
  }, [budgetData, viewMode]);

  const filteredBudgetRowsForPeriod = useMemo(() => {
    if (!budgetData?.length) return [];
    return getFilteredBudgetData().filter((item) => {
      const iso = budgetMonthYearToIsoKey(item.month, item.year);
      if (filters.month !== 'all' && iso !== filters.month) return false;
      if (viewMode === 'individual' && filters.account !== 'all' && item.account !== filters.account) return false;
      return true;
    });
  }, [budgetData, filters.month, filters.account, viewMode, getFilteredBudgetData]);

  const budgetPeriodRollup = useMemo(() => {
    if (!filteredBudgetRowsForPeriod.length) return null;
    let totE = 0;
    let totI = 0;
    for (const item of filteredBudgetRowsForPeriod) {
      if (viewMode === 'combined') {
        totE += Number(item.combinedExpenses) || 0;
        totI += Number(item.combinedIncome) || 0;
      } else {
        totE += Number(item.total_expenses_actual) || 0;
        totI += Number(item.total_income_actual) || 0;
      }
    }
    const catMap = aggregateExpenseCategoriesFromBudgetRows(
      filteredBudgetRowsForPeriod,
      viewMode
    );
    return { totE, totI, catMap };
  }, [filteredBudgetRowsForPeriod, viewMode]);

  const months = useMemo(() => {
    const fromTx = getAllMonths();
    const fromBudget = (budgetData || [])
      .map((b) => budgetMonthYearToIsoKey(b.month, b.year))
      .filter(Boolean);
    return [...new Set([...fromTx, ...fromBudget])].sort();
  }, [budgetData, transactions, getAllMonths]);

  const dashboardChartSeries = useMemo(() => {
    const txFallback = () => {
      const chartMonths = [...new Set(
        transactions
          .filter((t) => filters.account === 'all' || t.account === filters.account)
          .map((t) => t.date.substring(0, 7))
      )].sort();
      const monthlyBal = calculateMonthlyBalances(filters.account);
      const displayLabels = chartMonths.map(formatMonthKey);
      const mE = chartMonths.map((mo) =>
        transactions
          .filter((t) => t.type === 'expense' && t.date.startsWith(mo) && (filters.account === 'all' || t.account === filters.account))
          .reduce((s, t) => s + t.amount, 0)
      );
      const mI = chartMonths.map((mo) =>
        transactions
          .filter((t) => t.type === 'income' && t.date.startsWith(mo) && (filters.account === 'all' || t.account === filters.account))
          .reduce((s, t) => s + t.amount, 0)
      );
      const endBals = chartMonths.map((mo) => (monthlyBal[mo] ? monthlyBal[mo].endBalance : 0));
      const netSaved = chartMonths.map((mo) => {
        const b = monthlyBal[mo];
        return b ? b.income - b.expenses : 0;
      });
      return { chartMonths, displayLabels, mE, mI, endBals, netSaved, source: 'transactions' };
    };

    if (!budgetData?.length) return txFallback();

    const filteredBudgetRows = getFilteredBudgetData().filter((item) => {
      const iso = budgetMonthYearToIsoKey(item.month, item.year);
      if (filters.month !== 'all' && iso !== filters.month) return false;
      if (viewMode === 'individual' && filters.account !== 'all' && item.account !== filters.account) return false;
      return true;
    });

    if (!filteredBudgetRows.length) return txFallback();

    const map = {};
    for (const item of filteredBudgetRows) {
      const iso = budgetMonthYearToIsoKey(item.month, item.year);
      if (!iso) continue;
      if (!map[iso]) map[iso] = { spent: 0, inc: 0, start: 0, end: 0 };
      if (viewMode === 'combined') {
        map[iso].spent += Number(item.combinedExpenses) || 0;
        map[iso].inc += Number(item.combinedIncome) || 0;
        map[iso].start += Number(item.combinedStartBalance) || 0;
        map[iso].end += Number(item.combinedEndBalance) || 0;
    } else {
        map[iso].spent += Number(item.total_expenses_actual) || 0;
        map[iso].inc += Number(item.total_income_actual) || 0;
        map[iso].start += Number(item.start_balance) || 0;
        map[iso].end += Number(item.end_balance) || 0;
      }
    }

    const chartMonths = Object.keys(map).sort();
    if (!chartMonths.length) return txFallback();

    return {
      chartMonths,
      displayLabels: chartMonths.map(formatMonthKey),
      mE: chartMonths.map((m) => map[m].spent),
      mI: chartMonths.map((m) => map[m].inc),
      endBals: chartMonths.map((m) => map[m].end),
      netSaved: chartMonths.map((m) => map[m].end - map[m].start),
      source: 'budget'
    };
  }, [budgetData, filters.month, filters.account, viewMode, getFilteredBudgetData, transactions, calculateMonthlyBalances]);

  /** Same rows/numbers as Budget Overview (Excel); null = no budget → use transaction running balance instead */
  const balanceSummaryFromBudget = useMemo(() => {
    if (!budgetData?.length) return null;
    const filtered = getFilteredBudgetData().filter((item) => {
      const iso = budgetMonthYearToIsoKey(item.month, item.year);
      if (filters.month !== 'all' && iso !== filters.month) return false;
      if (viewMode === 'individual' && filters.account !== 'all' && item.account !== filters.account) return false;
      return true;
    });

    return filtered
      .map((item) => {
        const iso = budgetMonthYearToIsoKey(item.month, item.year) || '';
        const startBalance = viewMode === 'combined' ? (item.combinedStartBalance ?? 0) : (item.start_balance || 0);
        const endBalance = viewMode === 'combined' ? (item.combinedEndBalance ?? 0) : (item.end_balance || 0);
        const change = endBalance - startBalance;
        const monthDisplay = (iso && (monthLabels[iso] || formatMonthKey(iso))) || `${item.month} ${item.year}`;
        const key = viewMode === 'combined' ? `combined-${iso}` : item.sheet;
        return {
          key,
          monthDisplay,
          isCombined: viewMode === 'combined',
          account: item.account,
          startBalance,
          endBalance,
          change,
          iso
        };
      })
      .sort((a, b) => (a.iso || '').localeCompare(b.iso || ''));
  }, [budgetData, filters.month, filters.account, viewMode, getFilteredBudgetData]);

  const rechartsModels = useMemo(() => {
    const data0 = getFiltered(filters);
    const exp0 = data0.filter((t) => t.type === 'expense');
    const inc0 = data0.filter((t) => t.type === 'income');
    const txTotE0 = exp0.reduce((s, t) => s + t.amount, 0);
    const txTotI0 = inc0.reduce((s, t) => s + t.amount, 0);
    const useBudgetCharts =
      budgetPeriodRollup &&
      (budgetPeriodRollup.totE > 0 || budgetPeriodRollup.totI > 0) &&
      txTotE0 + txTotI0 === 0;
    const catMapForCharts = {};
    if (exp0.length) {
      exp0.forEach((t) => {
        catMapForCharts[t.cat] = (catMapForCharts[t.cat] || 0) + t.amount;
      });
    } else if (useBudgetCharts && budgetPeriodRollup.catMap) {
      Object.assign(catMapForCharts, budgetPeriodRollup.catMap);
    }
    const pieTotE0 = useBudgetCharts ? budgetPeriodRollup.totE : txTotE0;
    if (useBudgetCharts && pieTotE0 > 0 && Object.keys(catMapForCharts).length === 0) {
      catMapForCharts['Budget summary'] = pieTotE0;
    }
    const sortedCats = Object.entries(catMapForCharts).sort((a, b) => b[1] - a[1]);
    const donutRows = sortedCats.map(([name, value]) => ({
      name,
      value,
      fill: getColor(name),
    }));
    const barRows = sortedCats.slice(0, 7).map(([name, amount]) => ({
      name,
      amount,
      fill: getColor(name),
    }));
    const { chartMonths, displayLabels, mE, mI, endBals, netSaved } = dashboardChartSeries;
    const monthlyBarData = chartMonths.map((_, i) => ({
      month: displayLabels[i] || chartMonths[i],
      expense: mE[i] || 0,
      income: mI[i] || 0,
      netSaved: netSaved[i] || 0,
      endBalance: endBals[i] || 0,
    }));
    const pieTotEPeriod = useBudgetCharts ? budgetPeriodRollup.totE : txTotE0;
    const pieTotIPeriod = useBudgetCharts ? budgetPeriodRollup.totI : txTotI0;
    const hasPeriodPie = pieTotEPeriod + pieTotIPeriod > 0;
    const piePeriodData = [
      { name: 'Expenses', value: pieTotEPeriod, fill: CHART_COL.expense },
      { name: 'Income', value: pieTotIPeriod, fill: CHART_COL.income },
    ];
    return {
      monthlyBarData,
      donutRows,
      barRows,
      piePeriodData,
      hasTrend: chartMonths.length > 0,
      hasDonut: donutRows.some((r) => r.value > 0),
      hasBar: barRows.length > 0,
      hasPeriodPie,
    };
  }, [dashboardChartSeries, budgetPeriodRollup, getFiltered, filters, transactions, getColor]);

  const data = getFiltered(filters);
  const exp = data.filter((t) => t.type === 'expense');
  const inc = data.filter((t) => t.type === 'income');
  const txTotE = exp.reduce((s, t) => s + t.amount, 0);
  const txTotI = inc.reduce((s, t) => s + t.amount, 0);
  const useBudgetSummary =
    budgetPeriodRollup &&
    (budgetPeriodRollup.totE > 0 || budgetPeriodRollup.totI > 0) &&
    txTotE + txTotI === 0;
  const totE = useBudgetSummary
    ? budgetPeriodRollup.totE
    : txTotE;
  const totI = useBudgetSummary
    ? budgetPeriodRollup.totI
    : txTotI;
  const net = totI - totE;

  const catMap = {};
  if (exp.length && txTotE > 0) {
    exp.forEach((t) => {
      catMap[t.cat] = (catMap[t.cat] || 0) + t.amount;
    });
  } else if (useBudgetSummary && budgetPeriodRollup.catMap) {
    Object.assign(catMap, budgetPeriodRollup.catMap);
  }
  if (useBudgetSummary && totE > 0 && Object.keys(catMap).length === 0) {
    catMap['Budget summary'] = totE;
  }
  const cats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
  const labels = cats.map((c) => c[0]);

  const fmtSigned = (n) => {
    if (n === null || n === undefined) return '₹';
    const sign = n >= 0 ? '+' : '-';
    return sign + '₹' + Math.abs(Math.round(n)).toLocaleString('en-IN');
  };

  const { source: dashChartSource } = dashboardChartSeries;
  const { monthlyBarData, donutRows, barRows, piePeriodData, hasTrend, hasDonut, hasBar, hasPeriodPie } = rechartsModels;
  const balanceFillId = `dashBalGrad-${useId().replace(/\W/g, '')}`;

  const axisMoneyTick = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return v;
    if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(0)}k`;
    return String(Math.round(n));
  };

  const donutChartData = donutRows.filter((r) => r.value > 0);

  return (
    <div className="section">
      <div className="filters">
        <select 
          className="filter-select" 
          value={filters.month}
          onChange={(e) => setFilters(prev => ({ ...prev, month: e.target.value }))}
        >
          <option value="all">All months</option>
          {months.map(m => (
            <option key={m} value={m}>{monthLabels[m] || formatMonthKey(m)}</option>
          ))}
        </select>
        <select 
          className="filter-select"
          value={filters.account}
          onChange={(e) => setFilters(prev => ({ ...prev, account: e.target.value }))}
        >
          <option value="all">All accounts</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.label}</option>
          ))}
        </select>
        {budgetData && budgetData.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>View:</span>
            <button
              type="button"
              onClick={() => setViewMode('individual')}
              style={{
                padding: '4px 8px',
                border: viewMode === 'individual' ? '0.5px solid #185FA5' : '0.5px solid var(--color-border-secondary)',
                borderRadius: '6px',
                fontSize: '11px',
                cursor: 'pointer',
                backgroundColor: viewMode === 'individual' ? '#185FA5' : 'var(--color-background-primary)',
                color: viewMode === 'individual' ? 'white' : 'var(--color-text-primary)'
              }}
            >
              Per sheet
            </button>
            <button
              type="button"
              onClick={() => setViewMode('combined')}
              style={{
                padding: '4px 8px',
                border: viewMode === 'combined' ? '0.5px solid #185FA5' : '0.5px solid var(--color-border-secondary)',
                borderRadius: '6px',
                fontSize: '11px',
                cursor: 'pointer',
                backgroundColor: viewMode === 'combined' ? '#185FA5' : 'var(--color-background-primary)',
                color: viewMode === 'combined' ? 'white' : 'var(--color-text-primary)'
              }}
            >
              Combined
            </button>
          </div>
        )}
      </div>

      {budgetData && budgetData.length > 0 && (
        <div className="chart-card" style={{ marginBottom: '1rem' }}>
          <div className="chart-title">Budget Overview</div>
          <div className="tbl-wrap" style={{ marginTop: '.5rem' }}>
            <div className="tbl-head dash-budget-grid">
              <span>Month</span>
              <span>Account</span>
              <span style={{ textAlign: 'right' }}>Start Bal.</span>
              <span style={{ textAlign: 'right' }}>End Bal.</span>
              <span style={{ textAlign: 'right' }}>Spent</span>
              <span style={{ textAlign: 'right' }}>Income</span>
              <span style={{ textAlign: 'right' }}>Difference</span>
            </div>
            <div>
              {(() => {
                const filteredBudget = getFilteredBudgetData().filter((item) => {
                  const iso = budgetMonthYearToIsoKey(item.month, item.year);
                  if (filters.month !== 'all' && iso !== filters.month) return false;
                  if (viewMode === 'individual' && filters.account !== 'all' && item.account !== filters.account) return false;
                  return true;
                });
                
                if (filteredBudget.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-secondary)' }}>
                      No budget data available for selected filters
                    </div>
                  );
                }
                
                return filteredBudget.map(item => {
                  const startBalance = viewMode === 'combined' ? item.combinedStartBalance : (item.start_balance || 0);
                  const endBalance = viewMode === 'combined' ? item.combinedEndBalance : (item.end_balance || 0);
                  const totalExpenses = viewMode === 'combined' ? item.combinedExpenses : (item.total_expenses_actual || 0);
                  const totalIncome = viewMode === 'combined' ? item.combinedIncome : (item.total_income_actual || 0);
                  const difference = endBalance - startBalance;
                  const iso = budgetMonthYearToIsoKey(item.month, item.year);
                  const monthDisplay = (iso && (monthLabels[iso] || formatMonthKey(iso))) || `${item.month} ${item.year}`;
                  
                  return (
                    <div key={viewMode === 'combined' ? `${item.month}-${item.year}` : item.sheet} 
                      className="tbl-row dash-budget-grid">
                      <span style={{ fontWeight: '500' }}>
                        {monthDisplay}
                      </span>
                      <span>
                        {viewMode === 'combined' ? (
                          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                            All accounts
                          </span>
                        ) : (
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: '500',
                            ...getAccountBadgeStyle(item.account, accounts)
                          }}>
                            {item.account}
                          </span>
                        )}
                      </span>
                      <span style={{ textAlign: 'right', color: 'var(--color-text-secondary)' }}>
                        {fmt(startBalance)}
                      </span>
                      <span style={{ textAlign: 'right', fontWeight: '500', color: endBalance >= startBalance ? '#3B6D11' : '#A32D2D' }}>
                        {fmt(endBalance)}
                      </span>
                      <span style={{ textAlign: 'right', color: '#A32D2D' }}>
                        {fmt(totalExpenses)}
                      </span>
                      <span style={{ textAlign: 'right', color: '#3B6D11' }}>
                        {fmt(totalIncome)}
                      </span>
                      <span style={{ textAlign: 'right', fontWeight: '500', color: difference >= 0 ? '#3B6D11' : '#A32D2D' }}>
                        {fmtSigned(difference)}
                      </span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}
      
      <div className="cards-row">
        <div className="mcard">
          <div className="mcard-label">Total expenses</div>
          <div className="mcard-val red">{fmt(totE)}</div>
        </div>
        <div className="mcard">
          <div className="mcard-label">Total income</div>
          <div className="mcard-val green">{fmt(totI)}</div>
        </div>
        <div className="mcard">
          <div className="mcard-label">Net</div>
          <div className={`mcard-val ${net >= 0 ? 'green' : 'red'}`}>{fmt(net)}</div>
        </div>
        <div className="mcard">
          <div className="mcard-label">Transactions</div>
          <div className="mcard-val blue">{data.length}</div>
        </div>
      </div>

      {accounts && accounts.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <div className="chart-title-caps" style={{ marginBottom: '10px' }}>
            Account balances
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '12px',
            }}
          >
            {accounts.map((a) => {
              const start = Number(a.startingBalance) || 0;
              const cur = Number(a.currentBalance) || 0;
              const ch = cur - start;
              const chPos = ch >= 0;
              const chStr = (ch >= 0 ? '+' : '-') + '₹' + Math.abs(Math.round(ch)).toLocaleString('en-IN');
              return (
                <div
                  key={a.id}
                  className="chart-card"
                  style={{ padding: '12px 14px', marginBottom: 0, boxShadow: '0 1px 3px rgba(0,0,0,.07)' }}
                >
                  <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                    {a.label}
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: cur >= start ? '#3B6D11' : '#A32D2D' }}>
                    {fmt(cur)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '6px' }}>
                    vs starting {fmt(start)}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: '600', marginTop: '4px', color: chPos ? '#3B6D11' : '#A32D2D' }}>
                    {chStr}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {useBudgetSummary ? (
        <div
          style={{
            fontSize: '12px',
            color: 'var(--color-text-secondary)',
            marginBottom: '10px',
            lineHeight: 1.45,
          }}
        >
          These totals match <strong>Budget Overview</strong> (Excel summary). The transaction count is{' '}
          <strong>0</strong> because no line-item sheet was imported — use sheet names containing{' '}
          <strong>Transaction</strong> in the sheet name, or add rows with <strong>+ Add Entry</strong>.
        </div>
      ) : null}

      <div className="chart-card" style={{ marginBottom: '1rem' }}>
        <div className="chart-title">Monthly Balance Summary</div>
        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '8px', lineHeight: 1.45 }}>
          {balanceSummaryFromBudget !== null ? (
            <>
              Same <strong>Excel</strong> start and end balances as <strong>Budget Overview</strong> (month, account, and Per sheet / Combined toggles match).{' '}
              <strong>Change</strong> is end balance minus start balance for each row.
              {filters.month !== 'all' && (
                <span>
                  {' '}
                  Only rows for <strong>{monthLabels[filters.month] || formatMonthKey(filters.month)}</strong> are shown when a month is selected.
                </span>
              )}
            </>
          ) : (
            <>
              Built from <strong>saved transactions</strong> only (running balance starts at ₹0 and chains month to month).{' '}
              Import a budget workbook to align this block with <strong>Budget Overview</strong>.
              {filters.month !== 'all' && (
                <span>
                  {' '}
                  With a month selected, one row is shown for that calendar month (same account filter).
                </span>
              )}
            </>
          )}
        </div>
        <div className="tbl-wrap" style={{ marginTop: '.5rem' }}>
          <div className="tbl-head dash-balance-grid">
            <span>Month</span>
            <span>Account</span>
            <span style={{ textAlign: 'right' }}>Start Balance</span>
            <span style={{ textAlign: 'right' }}>End Balance</span>
            <span style={{ textAlign: 'right' }}>Change</span>
          </div>
          <div>
            {balanceSummaryFromBudget !== null ? (
              balanceSummaryFromBudget.length > 0 ? (
                balanceSummaryFromBudget.map((row) => (
                  <div key={row.key} className="tbl-row dash-balance-grid">
                    <span style={{ fontWeight: '500' }}>{row.monthDisplay}</span>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                      {row.isCombined ? (
                        'All accounts'
                      ) : (
                        <span
                          style={{
                            padding: '2px 6px',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: '500',
                            ...getAccountBadgeStyle(row.account, accounts)
                          }}
                        >
                          {row.account}
                        </span>
                      )}
                    </span>
                    <span style={{ textAlign: 'right', color: 'var(--color-text-secondary)' }}>{fmt(row.startBalance)}</span>
                    <span style={{ textAlign: 'right', fontWeight: '500', color: row.endBalance >= row.startBalance ? '#3B6D11' : '#A32D2D' }}>
                      {fmt(row.endBalance)}
                    </span>
                    <span style={{ textAlign: 'right', fontWeight: '500', color: row.change >= 0 ? '#3B6D11' : '#A32D2D' }}>
                      {row.change >= 0 ? '+' : ''}{fmt(row.change)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="empty" style={{ padding: '1.25rem' }}>No budget rows for the selected filters.</div>
              )
            ) : filters.month === 'all' ? (
              (() => {
                const monthlyData = calculateMonthlyBalances(filters.account);
                const sortedMonths = Object.keys(monthlyData).sort();
                
                return sortedMonths.length > 0 ? (
                  sortedMonths.map(month => {
                    const balance = monthlyData[month];
                    const change = balance.endBalance - balance.startBalance;
                    return (
                      <div key={month} className="tbl-row dash-balance-grid">
                        <span style={{ fontWeight: '500' }}>
                          {/^\d{4}-\d{2}$/.test(month) ? (monthLabels[month] || formatMonthKey(month)) : month}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                          {filters.account === 'all' ? 'All accounts (merged)' : filters.account}
                        </span>
                        <span style={{ textAlign: 'right', color: 'var(--color-text-secondary)' }}>{fmt(balance.startBalance)}</span>
                        <span style={{ textAlign: 'right', fontWeight: '500', color: balance.endBalance >= 0 ? '#3B6D11' : '#A32D2D' }}>
                          {fmt(balance.endBalance)}
                        </span>
                        <span style={{ textAlign: 'right', fontWeight: '500', color: change >= 0 ? '#3B6D11' : '#A32D2D' }}>
                          {change >= 0 ? '+' : ''}{fmt(change)}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="empty">No balance data available</div>
                );
              })()
            ) : (
              (() => {
                const balance = getBalanceForMonth(filters.month, filters.account);
                const change = balance.endBalance - balance.startBalance;
                return (
                  <div className="tbl-row dash-balance-grid">
                    <span style={{ fontWeight: '500' }}>
                      {monthLabels[filters.month] || formatMonthKey(filters.month)}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                      {filters.account === 'all' ? 'All accounts' : filters.account}
                    </span>
                    <span style={{ textAlign: 'right', color: 'var(--color-text-secondary)' }}>{fmt(balance.startBalance)}</span>
                    <span style={{ textAlign: 'right', fontWeight: '500', color: balance.endBalance >= 0 ? '#3B6D11' : '#A32D2D' }}>
                      {fmt(balance.endBalance)}
                    </span>
                    <span style={{ textAlign: 'right', fontWeight: '500', color: change >= 0 ? '#3B6D11' : '#A32D2D' }}>
                      {change >= 0 ? '+' : ''}{fmt(change)}
                    </span>
                  </div>
                );
              })()
            )}
          </div>
        </div>
      </div>

      <div className="dash-chart-stack">
        <div className="dash-chart-pair">
          <div className="chart-card">
            <div className="chart-title-caps">Income vs expenses</div>
            {dashChartSource === 'budget' && (
              <div className="dash-chart-sub">
                Spent / income from <strong>Budget Overview</strong> (same filters as the table above).
              </div>
            )}
            <div className="dash-chart-tall" role="img" aria-label="Income versus expenses by month">
              {hasTrend ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyBarData} margin={{ top: 28, right: 10, left: 4, bottom: 4 }} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6c757d' }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 12, fill: '#6c757d' }} tickFormatter={axisMoneyTick} />
                    <Tooltip formatter={(value) => fmt(value)} contentStyle={{ fontSize: 12 }} />
                    <Legend verticalAlign="top" align="left" wrapperStyle={{ fontSize: 12, paddingBottom: 2 }} iconType="square" />
                    <Bar dataKey="expense" name="Expenses" fill={CHART_COL.expense} radius={[4, 4, 0, 0]} maxBarSize={34} />
                    <Bar dataKey="income" name="Income" fill={CHART_COL.income} radius={[4, 4, 0, 0]} maxBarSize={34} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="dash-chart-empty">
                  {dashChartSource === 'budget' ? 'No budget rows for these filters.' : 'Add transactions to see this chart.'}
                </div>
              )}
            </div>
          </div>
          <div className="chart-card">
            <div className="chart-title-caps">Monthly saved / lost</div>
            {dashChartSource === 'budget' && (
              <div className="dash-chart-sub">
                End balance minus start balance from <strong>Budget Overview</strong> (rolled up by month).
              </div>
            )}
            <div className="dash-chart-tall" role="img" aria-label="Net saved or lost per month">
              {hasTrend ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyBarData} margin={{ top: 8, right: 10, left: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" vertical={false} />
                    <ReferenceLine y={0} stroke="#ced4da" strokeWidth={1} />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6c757d' }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 12, fill: '#6c757d' }} tickFormatter={axisMoneyTick} />
                    <Tooltip formatter={(value) => fmt(value)} contentStyle={{ fontSize: 12 }} />
                    <Bar dataKey="netSaved" name="Saved / lost" radius={[4, 4, 4, 4]} maxBarSize={28}>
                      {monthlyBarData.map((entry, index) => (
                        <Cell
                          key={`net-${entry.month}-${index}`}
                          fill={entry.netSaved >= 0 ? CHART_COL.income : CHART_COL.expense}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="dash-chart-empty">
                  {dashChartSource === 'budget' ? 'No budget rows for these filters.' : 'Add transactions to see this chart.'}
                </div>
              )}
            </div>
          </div>
          <div className="chart-card">
            <div className="chart-title-caps">End-of-month balance</div>
            {dashChartSource === 'budget' && (
              <div className="dash-chart-sub">
                End balance from <strong>Budget Overview</strong> (Excel summary totals).
              </div>
            )}
            <div className="dash-chart-tall" role="img" aria-label="End of month balance trend">
              {hasTrend ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyBarData} margin={{ top: 8, right: 10, left: 4, bottom: 4 }}>
                    <defs>
                      <linearGradient id={balanceFillId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_COL.balance} stopOpacity={0.32} />
                        <stop offset="100%" stopColor={CHART_COL.balance} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6c757d' }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 12, fill: '#6c757d' }} tickFormatter={axisMoneyTick} />
                    <Tooltip formatter={(value) => fmt(value)} contentStyle={{ fontSize: 12 }} />
                    <Area
                      type="monotone"
                      dataKey="endBalance"
                      name="End balance"
                      stroke={CHART_COL.balance}
                      strokeWidth={2.5}
                      fill={`url(#${balanceFillId})`}
                      dot={{ r: 4, fill: '#fff', stroke: CHART_COL.balance, strokeWidth: 2 }}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="dash-chart-empty">
                  {dashChartSource === 'budget' ? 'No budget rows for these filters.' : 'Add transactions to see this chart.'}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="dash-lower-trio">
          <div className="chart-card">
            <div className="chart-title-caps">Income vs expenses (period)</div>
            <div className="dash-chart-tall" role="img" aria-label="Pie chart of income and expenses for filtered period">
              {hasPeriodPie ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={piePeriodData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="48%"
                      outerRadius={88}
                      paddingAngle={1}
                    >
                      {piePeriodData.map((entry, index) => (
                        <Cell key={`pie-${entry.name}-${index}`} fill={entry.fill} stroke="#fff" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => fmt(value)} />
                    <Legend
                      verticalAlign="bottom"
                      align="center"
                      wrapperStyle={{ fontSize: 12, paddingTop: 4 }}
                      iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="dash-chart-empty">No income or expenses for the current filters.</div>
              )}
            </div>
          </div>
          <div className="chart-card">
            <div className="chart-title-caps">Expenses by category</div>
            <div className="legend-row" style={{ marginBottom: 4 }}>
              {labels.slice(0, 8).map((l) => (
                <span key={l} className="legend-item">
                  <span className="ldot" style={{ background: getColor(l) }} />
                  {l}
                </span>
              ))}
            </div>
            <div className="dash-chart-tall" role="img" aria-label="Donut chart of expenses by category">
              {hasDonut && donutChartData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="42%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={72}
                      paddingAngle={1}
                    >
                      {donutChartData.map((entry, index) => (
                        <Cell key={`donut-${entry.name}-${index}`} fill={entry.fill} stroke="#fff" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => fmt(value)} />
                    <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: 11, paddingLeft: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="dash-chart-empty">No expense data for the current filters.</div>
              )}
            </div>
          </div>
          <div className="chart-card">
            <div className="chart-title-caps">Top spending categories</div>
            <div className="dash-chart-tall" role="img" aria-label="Bar chart of top expense categories">
              {hasBar ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={barRows} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" vertical={false} horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 12, fill: '#6c757d' }} tickFormatter={axisMoneyTick} />
                    <YAxis type="category" dataKey="name" width={96} tick={{ fontSize: 12, fill: '#495057' }} />
                    <Tooltip formatter={(value) => fmt(value)} contentStyle={{ fontSize: 12 }} />
                    <Bar dataKey="amount" name="Amount" radius={[0, 4, 4, 0]} maxBarSize={28}>
                      {barRows.map((entry, index) => (
                        <Cell key={`bar-${entry.name}-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="dash-chart-empty">No data</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
