import React, { useState } from 'react';
import { ACCOUNTS } from '../constants/accounts';

const ManualEntryModal = ({ show, onClose, onSubmit, categories, onAddCategory }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    category: '',
    description: '',
    type: 'expense',
    account: 'Canara',
    referenceNumber: '',
    transactionType: 'debit',
    paymentMethod: 'cash'
  });

  const getAvailableCategories = () => {
    if (!categories || !categories[formData.type]) return [];
    return categories[formData.type].map(cat => cat.name);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.category) return;
    if (formData.category === '__new__') return;

    onSubmit({
      ...formData,
      category: formData.category,
      amount: parseFloat(formData.amount)
    });
    
    // Reset form
    setFormData({
      date: new Date().toISOString().split('T')[0],
      amount: '',
      category: '',
      description: '',
      type: 'expense',
      account: 'Canara',
      referenceNumber: '',
      transactionType: 'debit',
      paymentMethod: 'cash'
    });
    
    onClose();
  };

  const handleTypeChange = (newType) => {
    setFormData(prev => ({ 
      ...prev, 
      type: newType,
      category: '' // Reset category when type changes
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'category' && value === '__new__') {
      onAddCategory(formData.type);
      setFormData((prev) => ({ ...prev, category: '' }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (!show) return null;

  return (
    <div className="modal-backdrop open" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: '400px' }}>
        <div className="modal-title">
          Add Manual Entry
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label className="form-label">Type</label>
            <div className="type-toggle">
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`type-btn ${formData.type === 'expense' ? 'exp-on' : ''}`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`type-btn ${formData.type === 'income' ? 'inc-on' : ''}`}
              >
                Income
              </button>
            </div>
          </div>

          <div className="form-row">
            <label className="form-label">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <label className="form-label">Amount (¥)</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="form-row">
            <label className="form-label">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">Select category</option>
              {getAvailableCategories().map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
              <option value="__new__">+ Create new category</option>
            </select>
          </div>

          <div className="form-row">
            <label className="form-label">Transaction Type</label>
            <select
              name="transactionType"
              value={formData.transactionType}
              onChange={handleChange}
            >
              <option value="debit">Debit</option>
              <option value="credit">Credit</option>
              <option value="transfer">Transfer</option>
              <option value="withdrawal">ATM Withdrawal</option>
              <option value="deposit">Deposit</option>
            </select>
          </div>

          <div className="form-row">
            <label className="form-label">Payment Method</label>
            <select
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
            >
              <option value="cash">Cash</option>
              <option value="card">Debit/Credit Card</option>
              <option value="upi">UPI</option>
              <option value="netbanking">Net Banking</option>
              <option value="cheque">Cheque</option>
              <option value="wallet">Digital Wallet</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-row">
            <label className="form-label">Description</label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter description"
            />
          </div>

          <div className="form-row">
            <label className="form-label">Account</label>
            <select
              name="account"
              value={formData.account}
              onChange={handleChange}
            >
              {ACCOUNTS.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualEntryModal;
