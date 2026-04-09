import React, { useState, useEffect } from 'react';

const Transactions = ({ transactions, categories, getColor, fmt, getFiltered, getAllMonths, getCatNames, openTxnModal, deleteTxn, getBalanceForMonth }) => {
  const [filters, setFilters] = useState({ 
    month: 'all', 
    account: 'all', 
    type: 'all', 
    category: 'all', 
    search: '' 
  });

  const allCategories = [...new Set(transactions.map(t => t.cat))].sort();

  const data = getFiltered(filters).sort((a, b) => b.date.localeCompare(a.date));
  const totE = data.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totI = data.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);

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
        <select 
          className="filter-select"
          value={filters.type}
          onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
        >
          <option value="all">All types</option>
          <option value="expense">Expenses</option>
          <option value="income">Income</option>
        </select>
        <select 
          className="filter-select"
          value={filters.category}
          onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
        >
          <option value="all">All categories</option>
          {allCategories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <input 
          type="text" 
          placeholder="Search..." 
          style={{
            border: '.5px solid var(--color-border-secondary)',
            borderRadius: 'var(--border-radius-md)',
            padding: '6px 9px',
            fontSize: '12px',
            background: 'var(--color-background-primary)',
            color: 'var(--color-text-primary)',
            width: '130px'
          }}
          value={filters.search}
          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
        />
      </div>
      
      <div className="sum-row">
        <div className="sum-card">
          <div className="sum-label">Expenses</div>
          <div className="sum-val red">{fmt(totE)}</div>
        </div>
        <div className="sum-card">
          <div className="sum-label">Income</div>
          <div className="sum-val green">{fmt(totI)}</div>
        </div>
        <div className="sum-card">
          <div className="sum-label">Count</div>
          <div className="sum-val">{data.length}</div>
        </div>
      </div>

      {/* Balance Summary for Selected Month */}
      {filters.month !== 'all' && (
        <div className="sum-row" style={{ marginBottom: '.875rem' }}>
          <div className="sum-card">
            <div className="sum-label">Start Balance</div>
            <div className="sum-val" style={{ color: 'var(--color-text-secondary)' }}>
              {fmt(getBalanceForMonth(filters.month).startBalance)}
            </div>
          </div>
          <div className="sum-card">
            <div className="sum-label">End Balance</div>
            <div className="sum-val" style={{ 
              color: getBalanceForMonth(filters.month).endBalance >= 0 ? '#3B6D11' : '#A32D2D' 
            }}>
              {fmt(getBalanceForMonth(filters.month).endBalance)}
            </div>
          </div>
          <div className="sum-card">
            <div className="sum-label">Net Change</div>
            <div className="sum-val" style={{ 
              color: (getBalanceForMonth(filters.month).endBalance - getBalanceForMonth(filters.month).startBalance) >= 0 ? '#3B6D11' : '#A32D2D' 
            }}>
              {(getBalanceForMonth(filters.month).endBalance - getBalanceForMonth(filters.month).startBalance) >= 0 ? '+' : ''}
              {fmt(getBalanceForMonth(filters.month).endBalance - getBalanceForMonth(filters.month).startBalance)}
            </div>
          </div>
        </div>
      )}

      <div className="tbl-wrap">
        <div className="tbl-head txn-cols">
          <span>Date</span>
          <span>Description</span>
          <span>Category</span>
          <span>Amount</span>
          <span></span>
        </div>
        <div>
          {!data.length ? (
            <div className="empty">No transactions found</div>
          ) : (
            data.map(t => {
              const col = getColor(t.cat);
              const isE = t.type === 'expense';
              return (
                <div key={t.id} className="tbl-row txn-cols">
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                    {t.date}
                  </span>
                  <span>
                    {t.desc || '\u2014'}
                    <br />
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                      {t.account}
                    </span>
                  </span>
                  <span>
                    <span 
                      className="cat-badge" 
                      style={{ background: `${col}22`, color: col }}
                    >
                      {t.cat}
                    </span>
                  </span>
                  <span style={{ 
                    fontWeight: '500', 
                    color: isE ? '#A32D2D' : '#3B6D11'
                  }}>
                    {isE ? '-' : '+'}{fmt(t.amount)}
                  </span>
                  <div style={{ display: 'flex', gap: '3px', justifyContent: 'flex-end' }}>
                    <button className="icon-btn" onClick={() => openTxnModal(t.id)}></button>
                    <button className="icon-btn" onClick={() => deleteTxn(t.id)}></button>
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
