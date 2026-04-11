import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Chart, registerables } from 'chart.js';
import { getAccountBadgeStyle } from '../utils/accounts';
import { budgetMonthYearToIsoKey } from '../utils/monthKeys';

Chart.register(...registerables);

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

const COL = {
  expenseBar: 'rgba(226, 154, 148, 0.92)',
  incomeBar: 'rgba(139, 168, 136, 0.92)',
  balanceLine: '#185FA5',
  netPos: 'rgba(139, 168, 136, 0.9)',
  netNeg: 'rgba(226, 154, 148, 0.95)',
  pieExp: '#E29A94',
  pieInc: '#8BA888',
  grid: 'rgba(0, 0, 0, 0.06)'
};

const Dashboard = ({ transactions, categories, accounts, getColor, fmt, getFiltered, getAllMonths, calculateMonthlyBalances, getBalanceForMonth, budgetData, viewMode, setViewMode }) => {
  const [filters, setFilters] = useState({ month: 'all', account: 'all' });
  const groupedBarRef = useRef(null);
  const balanceLineRef = useRef(null);
  const netBarRef = useRef(null);
  const catChartRef = useRef(null);
  const pieMixRef = useRef(null);

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

  useEffect(() => {
    const { chartMonths, displayLabels, mE, mI, endBals, netSaved } = dashboardChartSeries;
    const data = getFiltered(filters);
    const exp = data.filter(t => t.type === 'expense');
    const inc = data.filter(t => t.type === 'income');

    const yTickK = (v) => {
      const n = Number(v);
      if (!Number.isFinite(n)) return v;
      if (Math.abs(n) >= 1000) return (n / 1000).toFixed(0) + 'k';
      return n;
    };

    const commonScale = {
      ticks: { font: { size: 11 }, color: '#6c757d' },
      grid: { color: COL.grid },
      border: { display: false }
    };

    const destroy = (ref) => {
      if (ref.current) {
        ref.current.destroy();
        ref.current = null;
      }
    };

    destroy(groupedBarRef);
    destroy(balanceLineRef);
    destroy(netBarRef);
    destroy(catChartRef);
    destroy(pieMixRef);

    if (chartMonths.length && document.getElementById('dashGroupedBar')) {
      groupedBarRef.current = new Chart(document.getElementById('dashGroupedBar'), {
        type: 'bar',
        data: {
          labels: displayLabels,
          datasets: [
            { label: 'Expenses', data: mE, backgroundColor: COL.expenseBar, borderWidth: 0, borderRadius: 5, maxBarThickness: 36 },
            { label: 'Income', data: mI, backgroundColor: COL.incomeBar, borderWidth: 0, borderRadius: 5, maxBarThickness: 36 }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: {
              display: true,
              position: 'top',
              align: 'start',
              labels: {
                boxWidth: 10,
                boxHeight: 10,
                padding: 14,
                font: { size: 11, weight: '500' },
                color: '#495057',
                usePointStyle: true,
                pointStyle: 'rectRounded'
              }
            },
            tooltip: {
              callbacks: { label: (ctx) => `${ctx.dataset.label}: ${fmt(ctx.raw)}` }
            }
          },
          scales: {
            x: {
              ...commonScale,
              ticks: { ...commonScale.ticks, maxRotation: 45, minRotation: 0 },
              grid: { display: false }
            },
            y: {
              beginAtZero: true,
              ...commonScale,
              ticks: { ...commonScale.ticks, callback: (v) => yTickK(v) }
            }
          }
        }
      });
    }

    if (chartMonths.length && document.getElementById('dashBalanceLine')) {
      balanceLineRef.current = new Chart(document.getElementById('dashBalanceLine'), {
        type: 'line',
        data: {
          labels: displayLabels,
          datasets: [{
            label: 'End balance',
            data: endBals,
            borderColor: COL.balanceLine,
            borderWidth: 2.5,
            tension: 0.42,
            fill: true,
            pointRadius: 5,
            pointHoverRadius: 6,
            pointBackgroundColor: '#fff',
            pointBorderColor: COL.balanceLine,
            pointBorderWidth: 2,
            backgroundColor: (context) => {
              const c = context.chart;
              const { ctx, chartArea } = c;
              if (!chartArea) return 'rgba(24,95,165,.12)';
              const g = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
              g.addColorStop(0, 'rgba(24, 95, 165, 0.28)');
              g.addColorStop(1, 'rgba(24, 95, 165, 0)');
              return g;
            }
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (ctx) => `${fmt(ctx.raw)}` } }
          },
          scales: {
            x: {
              ...commonScale,
              ticks: { ...commonScale.ticks, maxRotation: 45, minRotation: 0 },
              grid: { display: false }
            },
            y: {
              ...commonScale,
              ticks: { ...commonScale.ticks, callback: (v) => yTickK(v) }
            }
          }
        }
      });
    }

    if (chartMonths.length && document.getElementById('dashNetBar')) {
      netBarRef.current = new Chart(document.getElementById('dashNetBar'), {
        type: 'bar',
        data: {
          labels: displayLabels,
          datasets: [{
            label: 'Saved / lost',
            data: netSaved,
            backgroundColor: netSaved.map((v) => (v >= 0 ? COL.netPos : COL.netNeg)),
            borderWidth: 0,
            borderRadius: 5,
            maxBarThickness: 28
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const v = ctx.raw;
                  return (v >= 0 ? 'Saved: ' : 'Lost: ') + fmt(Math.abs(v));
                }
              }
            }
          },
          scales: {
            x: {
              ...commonScale,
              ticks: { ...commonScale.ticks, maxRotation: 45, minRotation: 0 },
              grid: { display: false }
            },
            y: {
              ...commonScale,
              ticks: { ...commonScale.ticks, callback: (v) => yTickK(v) }
            }
          }
        }
      });
    }

    const catMap = {};
    exp.forEach(t => { catMap[t.cat] = (catMap[t.cat] || 0) + t.amount; });
    const cats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
    const labels = cats.map(c => c[0]);
    const vals = cats.map(c => c[1]);
    const colors = labels.map(l => getColor(l));

    if (vals.length && document.getElementById('catChart')) {
      catChartRef.current = new Chart(document.getElementById('catChart'), {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            data: vals,
            backgroundColor: colors.map((c) => (c + 'CC')),
            borderWidth: 2,
            borderColor: '#fff',
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '62%',
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${fmt(ctx.raw)}` } }
          }
        }
      });
    }

    const totE = exp.reduce((s, t) => s + t.amount, 0);
    const totI = inc.reduce((s, t) => s + t.amount, 0);
    if (totE + totI > 0 && document.getElementById('dashIncomeExpensePie')) {
      pieMixRef.current = new Chart(document.getElementById('dashIncomeExpensePie'), {
        type: 'pie',
        data: {
          labels: ['Expenses', 'Income'],
          datasets: [{
            data: [totE, totI],
            backgroundColor: [COL.pieExp, COL.pieInc],
            borderWidth: 2,
            borderColor: '#fff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { boxWidth: 10, padding: 12, font: { size: 11 }, color: '#495057', usePointStyle: true }
            },
            tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${fmt(ctx.raw)}` } }
          }
        }
      });
    }

    return () => {
      destroy(groupedBarRef);
      destroy(balanceLineRef);
      destroy(netBarRef);
      destroy(catChartRef);
      destroy(pieMixRef);
    };
  }, [dashboardChartSeries, filters, transactions, getColor, fmt, getFiltered]);

  const data = getFiltered(filters);
  const exp = data.filter(t => t.type === 'expense');
  const inc = data.filter(t => t.type === 'income');
  const totE = exp.reduce((s, t) => s + t.amount, 0);
  const totI = inc.reduce((s, t) => s + t.amount, 0);
  const net = totI - totE;

  const catMap = {};
  exp.forEach(t => { catMap[t.cat] = (catMap[t.cat] || 0) + t.amount; });
  const cats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
  const labels = cats.map(c => c[0]);

  const months = useMemo(() => {
    const fromTx = getAllMonths();
    const fromBudget = (budgetData || [])
      .map((b) => budgetMonthYearToIsoKey(b.month, b.year))
      .filter(Boolean);
    return [...new Set([...fromTx, ...fromBudget])].sort();
  }, [budgetData, transactions, getAllMonths]);

  const fmtSigned = (n) => {
    if (n === null || n === undefined) return '₹';
    const sign = n >= 0 ? '+' : '-';
    return sign + '₹' + Math.abs(Math.round(n)).toLocaleString('en-IN');
  };

  const { chartMonths, source: dashChartSource } = dashboardChartSeries;

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
              <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '6px', lineHeight: 1.35 }}>
                Spent / income from <strong>Budget Overview</strong> (same filters as the table above).
              </div>
            )}
            <div className="dash-chart-tall">
              {chartMonths.length ? (
                <canvas id="dashGroupedBar" role="img" aria-label="Income versus expenses by month" />
              ) : (
                <div className="empty" style={{ padding: '2rem 1rem' }}>
                  {dashChartSource === 'budget' ? 'No budget rows for these filters.' : 'Add transactions to see this chart.'}
                </div>
              )}
            </div>
          </div>
          <div className="chart-card">
            <div className="chart-title-caps">Monthly saved / lost</div>
            {dashChartSource === 'budget' && (
              <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '6px', lineHeight: 1.35 }}>
                End balance minus start balance from <strong>Budget Overview</strong> (same as the Difference column when values are rolled up by month).
              </div>
            )}
            <div className="dash-chart-tall">
              {chartMonths.length ? (
                <canvas id="dashNetBar" role="img" aria-label="Net saved or lost per month" />
              ) : (
                <div className="empty" style={{ padding: '2rem 1rem' }}>
                  {dashChartSource === 'budget' ? 'No budget rows for these filters.' : 'Add transactions to see this chart.'}
                </div>
              )}
            </div>
          </div>
          <div className="chart-card">
            <div className="chart-title-caps">End-of-month balance</div>
            {dashChartSource === 'budget' && (
              <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '6px', lineHeight: 1.35 }}>
                End balance from <strong>Budget Overview</strong> (Excel summary totals).
              </div>
            )}
            <div className="dash-chart-tall">
              {chartMonths.length ? (
                <canvas id="dashBalanceLine" role="img" aria-label="End of month balance trend" />
              ) : (
                <div className="empty" style={{ padding: '2rem 1rem' }}>
                  {dashChartSource === 'budget' ? 'No budget rows for these filters.' : 'Add transactions to see this chart.'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="dash-lower-trio">
        <div className="chart-card">
          <div className="chart-title-caps">Income vs expenses (period)</div>
          <div className="dash-chart-tall">
            {totE + totI > 0 ? (
              <canvas id="dashIncomeExpensePie" role="img" aria-label="Pie chart of income and expenses for filtered period" />
            ) : (
              <div className="empty" style={{ padding: '2rem 1rem' }}>No income or expenses for the current filters.</div>
            )}
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-title-caps">Expenses by category</div>
          <div className="legend-row">
            {labels.slice(0, 8).map((l) => (
              <span key={l} className="legend-item">
                <span className="ldot" style={{ background: getColor(l) }}></span>
                {l}
              </span>
            ))}
          </div>
          <div className="dash-chart-tall">
            {labels.length ? (
              <canvas id="catChart" role="img" aria-label="Donut chart of expenses by category" />
            ) : (
              <div className="empty" style={{ padding: '2rem 1rem' }}>No expense data for the current filters.</div>
            )}
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-title-caps">Top spending categories</div>
          <div className="dash-top-cats-body">
            {cats.slice(0, 7).map(([cat, amt]) => {
              const totForPct = cats.reduce((s, c) => s + c[1], 0);
              const pct = totForPct > 0 ? Math.round(amt / totForPct * 100) : 0;
              const col = getColor(cat);
              return (
                <div key={cat} className="cat-row">
                  <span className="cat-name">{cat}</span>
                  <div style={{ flex: 2 }}>
                    <div className="pbar-wrap">
                      <div className="pbar" style={{ width: `${pct}%`, background: col }}></div>
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', minWidth: '28px', textAlign: 'right' }}>{pct}%</span>
                  <span style={{ fontSize: '13px', fontWeight: '500', minWidth: '70px', textAlign: 'right' }}>{fmt(amt)}</span>
                </div>
              );
            })}
            {cats.length === 0 && <div className="empty">No data</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
