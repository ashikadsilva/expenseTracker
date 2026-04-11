import React, { useState } from 'react';

const CategoriesView = ({ transactions, categories, getColor, fmt, getFiltered, getAllMonths }) => {
  const [filters, setFilters] = useState({ month: 'all', account: 'all' });

  const data = getFiltered(filters).filter(t => t.type === 'expense');
  const catMap = {};
  data.forEach(t => { catMap[t.cat] = (catMap[t.cat] || 0) + t.amount; });
  const cats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
  const total = cats.reduce((s, c) => s + c[1], 0);

  return (
    <div className="section">
      <div className="filters">
        <select 
          className="filter-select"
          value={filters.month}
          onChange={(e) => setFilters(prev => ({ ...prev, month: e.target.value }))}
        >
          <option value="all">All months</option>
          {getAllMonths().map(m => (
            <option key={m} value={m}>{m}</option>
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
      
      <div id="cat-view-body">
        {!cats.length ? (
          <div className="empty">No expense data</div>
        ) : (
          <div className="tbl-wrap">
            <div className="tbl-head" style={{ gridTemplateColumns: '130px 1fr 90px 70px' }}>
              <span>Category</span>
              <span>Share</span>
              <span style={{ textAlign: 'right' }}>Amount</span>
              <span style={{ textAlign: 'right' }}>%</span>
            </div>
            {cats.map(([cat, amt]) => {
              const pct = total > 0 ? (amt / total * 100).toFixed(1) : 0;
              const col = getColor(cat);
              return (
                <div key={cat} className="tbl-row" style={{ gridTemplateColumns: '130px 1fr 90px 70px' }}>
                  <span style={{ fontWeight: '500' }}>{cat}</span>
                  <div>
                    <div className="pbar-wrap">
                      <div className="pbar" style={{ width: `${pct}%`, background: col }}></div>
                    </div>
                  </div>
                  <span style={{ textAlign: 'right', fontWeight: '500', color: '#A32D2D' }}>
                    {fmt(amt)}
                  </span>
                  <span style={{ textAlign: 'right', color: 'var(--color-text-secondary)' }}>
                    {pct}%
                  </span>
                </div>
              );
            })}
            <div className="tbl-row" style={{ 
              gridTemplateColumns: '130px 1fr 90px 70px', 
              fontWeight: '500', 
              borderTop: '.5px solid var(--color-border-secondary)' 
            }}>
              <span>Total</span>
              <span></span>
              <span style={{ textAlign: 'right', color: '#A32D2D' }}>{fmt(total)}</span>
              <span></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoriesView;
