import React, { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const monthLabels = {
  '2025-08': 'Aug 2025', '2025-09': 'Sep 2025', '2025-10': 'Oct 2025', '2025-11': 'Nov 2025',
  '2025-12': 'Dec 2025', '2026-01': 'Jan 2026', '2026-02': 'Feb 2026', '2026-03': 'Mar 2026', '2026-04': 'Apr 2026'
};

const Dashboard = ({ transactions, categories, getColor, fmt, getFiltered, getAllMonths, calculateMonthlyBalances, getBalanceForMonth }) => {
  const [filters, setFilters] = useState({ month: 'all', account: 'all' });
  const catChartRef = useRef(null);
  const trendChartRef = useRef(null);

  useEffect(() => {
    const data = getFiltered(filters);
    const exp = data.filter(t => t.type === 'expense');
    const inc = data.filter(t => t.type === 'income');
    
    // Category donut chart
    const catMap = {};
    exp.forEach(t => { catMap[t.cat] = (catMap[t.cat] || 0) + t.amount; });
    const cats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
    const labels = cats.map(c => c[0]);
    const vals = cats.map(c => c[1]);
    const colors = labels.map(l => getColor(l));

    if (catChartRef.current) {
      catChartRef.current.destroy();
    }

    if (vals.length && document.getElementById('catChart')) {
      catChartRef.current = new Chart(document.getElementById('catChart'), {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            data: vals,
            backgroundColor: colors,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,.5)'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: ctx => `${ctx.label}: ${fmt(ctx.raw)}`
              }
            }
          }
        }
      });
    }

    // Monthly trend chart
    const months = ['2025-08', '2025-09', '2025-10', '2025-11', '2025-12', '2026-01', '2026-02'];
    const mL = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
    
    const mE = months.map(mo => 
      transactions.filter(t => 
        t.type === 'expense' && 
        t.date.startsWith(mo) && 
        (filters.account === 'all' || t.account === filters.account)
      ).reduce((s, t) => s + t.amount, 0)
    );
    
    const mI = months.map(mo => 
      transactions.filter(t => 
        t.type === 'income' && 
        t.date.startsWith(mo) && 
        (filters.account === 'all' || t.account === filters.account)
      ).reduce((s, t) => s + t.amount, 0)
    );

    if (trendChartRef.current) {
      trendChartRef.current.destroy();
    }

    if (document.getElementById('trendChart')) {
      trendChartRef.current = new Chart(document.getElementById('trendChart'), {
        type: 'line',
        data: {
          labels: mL,
          datasets: [
            {
              label: 'Expenses',
              data: mE,
              borderColor: '#E24B4A',
              backgroundColor: 'rgba(226,75,74,.07)',
              tension: 0.4,
              fill: true,
              pointRadius: 3
            },
            {
              label: 'Income',
              data: mI,
              borderColor: '#639922',
              backgroundColor: 'rgba(99,153,34,.07)',
              tension: 0.4,
              fill: true,
              pointRadius: 3
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              ticks: {
                callback: v => v >= 1000 ? (v/1000).toFixed(0) + 'k' : v,
                font: { size: 11 }
              },
              grid: { color: 'rgba(128,128,128,.08)' }
            },
            x: {
              ticks: { font: { size: 11 } },
              grid: { display: false }
            }
          }
        }
      });
    }
  }, [filters, transactions, getColor, fmt, getFiltered]);

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

  const months = getAllMonths();

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
            <option key={m} value={m}>{monthLabels[m] || m}</option>
          ))}
        </select>
        <select 
          className="filter-select"
          value={filters.account}
          onChange={(e) => setFilters(prev => ({ ...prev, account: e.target.value }))}
        >
          <option value="all">Both accounts</option>
          <option value="Canara">Canara Bank</option>
          <option value="Union">Union Bank</option>
        </select>
      </div>
      
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

      {/* Balance Summary Section */}
      <div className="chart-card" style={{ marginBottom: '1rem' }}>
        <div className="chart-title">Monthly Balance Summary</div>
        <div className="tbl-wrap" style={{ marginTop: '.5rem' }}>
          <div className="tbl-head" style={{ gridTemplateColumns: '120px 1fr 90px 90px 90px' }}>
            <span>Month</span>
            <span>Account</span>
            <span style={{ textAlign: 'right' }}>Start Balance</span>
            <span style={{ textAlign: 'right' }}>End Balance</span>
            <span style={{ textAlign: 'right' }}>Change</span>
          </div>
          <div>
            {filters.month === 'all' ? (
              // Show all months when "All months" is selected
              (() => {
                const monthlyData = calculateMonthlyBalances();
                const sortedMonths = Object.keys(monthlyData).sort();
                
                return sortedMonths.length > 0 ? (
                  sortedMonths.map(month => {
                    const balance = monthlyData[month];
                    const change = balance.endBalance - balance.startBalance;
                    return (
                      <div key={month} className="tbl-row" style={{ gridTemplateColumns: '120px 1fr 90px 90px 90px' }}>
                        <span style={{ fontWeight: '500' }}>{monthLabels[month] || month}</span>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Both accounts</span>
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
              // Show specific month when filtered
              (() => {
                const balance = getBalanceForMonth(filters.month);
                const change = balance.endBalance - balance.startBalance;
                return (
                  <div className="tbl-row" style={{ gridTemplateColumns: '120px 1fr 90px 90px 90px' }}>
                    <span style={{ fontWeight: '500' }}>{monthLabels[filters.month] || filters.month}</span>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                      {filters.account === 'all' ? 'Both accounts' : filters.account}
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

      <div className="chart-row">
        <div className="chart-card">
          <div className="chart-title">Expenses by category</div>
          <div className="legend-row">
            {labels.slice(0, 8).map((l, i) => (
              <span key={l} className="legend-item">
                <span className="ldot" style={{ background: getColor(l) }}></span>
                {l}
              </span>
            ))}
          </div>
          <div style={{ position: 'relative', height: '190px' }}>
            <canvas id="catChart" role="img" aria-label="Donut chart of expenses by category"></canvas>
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-title">Monthly trend</div>
          <div style={{ position: 'relative', height: '210px' }}>
            <canvas id="trendChart" role="img" aria-label="Monthly expense and income trend"></canvas>
          </div>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-title">Top spending categories</div>
        <div style={{ marginTop: '.5rem' }}>
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
          }) || <div className="empty">No data</div>}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
