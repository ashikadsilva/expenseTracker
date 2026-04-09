import React from 'react';

const ManageCategories = ({ categories, openCatModal, deleteCat }) => {
  return (
    <div className="section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.875rem' }}>
        <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Manage your expense and income categories</span>
        <button className="btn btn-primary" onClick={() => openCatModal()}>+ New category</button>
      </div>
      
      <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--color-text-secondary)', marginBottom: '.5rem', textTransform: 'uppercase', letterSpacing: '.4px' }}>
        Expense categories
      </div>
      <div className="cat-grid" id="expense-cats">
        {categories.expense.map(c => (
          <div key={c.name} className="cat-item">
            <div className="cat-dot" style={{ background: c.color }}></div>
            <span className="cat-item-name">{c.name}</span>
            <button className="icon-btn" onClick={() => openCatModal(c.name, 'expense')}></button>
            <button className="icon-btn" onClick={() => deleteCat(c.name, 'expense')}></button>
          </div>
        ))}
      </div>
      
      <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--color-text-secondary)', marginBottom: '.5rem', marginTop: '.875rem', textTransform: 'uppercase', letterSpacing: '.4px' }}>
        Income categories
      </div>
      <div className="cat-grid" id="income-cats">
        {categories.income.map(c => (
          <div key={c.name} className="cat-item">
            <div className="cat-dot" style={{ background: c.color }}></div>
            <span className="cat-item-name">{c.name}</span>
            <button className="icon-btn" onClick={() => openCatModal(c.name, 'income')}></button>
            <button className="icon-btn" onClick={() => deleteCat(c.name, 'income')}></button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManageCategories;
