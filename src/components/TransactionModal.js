import React, { useState, useEffect } from 'react';
import { defaultAccountId } from '../utils/accounts';

const TransactionModal = ({ 
  show, 
  onClose, 
  onSave, 
  editTxnId, 
  transactions, 
  categories, 
  accounts,
  currentTxnType, 
  setCurrentTxnType, 
  getCatNames,
  onAddCategory
}) => {
  const [formData, setFormData] = useState({
    date: '',
    amount: '',
    description: '',
    category: '',
    account: defaultAccountId(accounts)
  });

  useEffect(() => {
    if (editTxnId) {
      const txn = transactions.find(t => t.id === editTxnId);
      if (txn) {
        setCurrentTxnType(txn.type);
        setFormData({
          date: txn.date,
          amount: txn.amount,
          description: txn.desc || '',
          category: txn.cat,
          account: txn.account
        });
      }
    } else {
      setCurrentTxnType('expense');
      setFormData({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        description: '',
        category: '',
        account: defaultAccountId(accounts)
      });
    }
  }, [editTxnId, transactions, setCurrentTxnType, accounts]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.date || !formData.amount || isNaN(parseFloat(formData.amount))) {
      alert('Fill date and amount.');
      return;
    }
    
    onSave({
      date: formData.date,
      amount: parseFloat(formData.amount),
      desc: formData.description,
      cat: formData.category,
      account: formData.account
    });
  };

  const availableCategories = getCatNames(currentTxnType);

  const handleCategoryChange = (value) => {
    if (value === '__new__' && onAddCategory) {
      onAddCategory(currentTxnType);
      setFormData((prev) => ({ ...prev, category: '' }));
      return;
    }
    setFormData((prev) => ({ ...prev, category: value }));
  };

  if (!show) return null;

  return (
    <div className="modal-backdrop open" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">
          {editTxnId ? 'Edit transaction' : 'Add transaction'}
        </div>
        
        <div className="type-toggle">
          <button 
            className={`type-btn ${currentTxnType === 'expense' ? 'exp-on' : ''}`}
            onClick={() => setCurrentTxnType('expense')}
          >
            Expense
          </button>
          <button 
            className={`type-btn ${currentTxnType === 'income' ? 'inc-on' : ''}`}
            onClick={() => setCurrentTxnType('income')}
          >
            Income
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label className="form-label">Date</label>
            <input 
              type="date" 
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>
          
          <div className="form-row">
            <label className="form-label">Amount (₹)</label>
            <input 
              type="number" 
              placeholder="0" 
              min="0"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              required
            />
          </div>
          
          <div className="form-row">
            <label className="form-label">Description</label>
            <input 
              type="text" 
              placeholder="e.g. Zomato"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          
          <div className="form-row">
            <label className="form-label">Category</label>
            <select 
              value={formData.category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              required
            >
              <option value="">Select category</option>
              {availableCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
              {onAddCategory && (
                <option value="__new__">+ Create new category</option>
              )}
            </select>
          </div>
          
          <div className="form-row">
            <label className="form-label">Account</label>
            <select 
              value={formData.account}
              onChange={(e) => setFormData(prev => ({ ...prev, account: e.target.value }))}
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.label}</option>
              ))}
              {formData.account &&
              !accounts.some((a) => a.id === formData.account) ? (
                <option value={formData.account}>{formData.account} (legacy)</option>
              ) : null}
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionModal;
