import React, { useState } from 'react';

const ManualEntryModal = ({ show, onClose, onSubmit, categories }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    category: '',
    description: '',
    type: 'expense',
    account: 'Canara'
  });

  const getAvailableCategories = () => {
    if (!categories || !categories[formData.type]) return [];
    return categories[formData.type].map(cat => cat.name);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.category) return;
    
    let finalCategory = formData.category;
    if (formData.category === '__new__') {
      finalCategory = formData.newCategory;
    }
    
    if (!finalCategory) return;
    
    onSubmit({
      ...formData,
      category: finalCategory,
      amount: parseFloat(formData.amount)
    });
    
    // Reset form
    setFormData({
      date: new Date().toISOString().split('T')[0],
      amount: '',
      category: '',
      description: '',
      type: 'expense',
      account: 'Canara'
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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'var(--color-background-primary)',
        borderRadius: '12px',
        padding: '1.5rem',
        width: '90%',
        maxWidth: '400px',
        border: '0.5px solid var(--color-border-tertiary)'
      }}>
        <div style={{
          fontSize: '16px',
          fontWeight: '500',
          marginBottom: '1rem',
          color: 'var(--color-text-primary)'
        }}>
          Add Manual Entry
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              fontSize: '12px',
              color: 'var(--color-text-secondary)',
              marginBottom: '4px',
              display: 'block'
            }}>
              Type
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                style={{
                  flex: 1,
                  padding: '8px',
                  border: formData.type === 'expense' ? '0.5px solid #A32D2D' : '0.5px solid var(--color-border-secondary)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  backgroundColor: formData.type === 'expense' ? '#FCEBEB' : 'var(--color-background-primary)',
                  color: formData.type === 'expense' ? '#A32D2D' : 'var(--color-text-primary)'
                }}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                style={{
                  flex: 1,
                  padding: '8px',
                  border: formData.type === 'income' ? '0.5px solid #3B6D11' : '0.5px solid var(--color-border-secondary)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  backgroundColor: formData.type === 'income' ? '#EAF3DE' : 'var(--color-background-primary)',
                  color: formData.type === 'income' ? '#3B6D11' : 'var(--color-text-primary)'
                }}
              >
                Income
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              fontSize: '12px',
              color: 'var(--color-text-secondary)',
              marginBottom: '4px',
              display: 'block'
            }}>
              Date
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                backgroundColor: 'var(--color-background-primary)',
                border: '0.5px solid var(--color-border-secondary)',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '13px',
                color: 'var(--color-text-primary)'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              fontSize: '12px',
              color: 'var(--color-text-secondary)',
              marginBottom: '4px',
              display: 'block'
            }}>
              Amount (¥)
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0"
              min="0"
              step="0.01"
              required
              style={{
                width: '100%',
                backgroundColor: 'var(--color-background-primary)',
                border: '0.5px solid var(--color-border-secondary)',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '13px',
                color: 'var(--color-text-primary)'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              fontSize: '12px',
              color: 'var(--color-text-secondary)',
              marginBottom: '4px',
              display: 'block'
            }}>
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                backgroundColor: 'var(--color-background-primary)',
                border: '0.5px solid var(--color-border-secondary)',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '13px',
                color: 'var(--color-text-primary)',
                cursor: 'pointer'
              }}
            >
              <option value="">Select category</option>
              {getAvailableCategories().map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
              <option value="__new__">+ Create new category</option>
            </select>
            {formData.category === '__new__' && (
              <input
                type="text"
                name="newCategory"
                value={formData.newCategory || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, newCategory: e.target.value }))}
                placeholder="Enter new category name"
                required
                style={{
                  width: '100%',
                  backgroundColor: 'var(--color-background-primary)',
                  border: '0.5px solid var(--color-border-secondary)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '13px',
                  color: 'var(--color-text-primary)',
                  marginTop: '8px'
                }}
              />
            )}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              fontSize: '12px',
              color: 'var(--color-text-secondary)',
              marginBottom: '4px',
              display: 'block'
            }}>
              Description
            </label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter description"
              style={{
                width: '100%',
                backgroundColor: 'var(--color-background-primary)',
                border: '0.5px solid var(--color-border-secondary)',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '13px',
                color: 'var(--color-text-primary)'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              fontSize: '12px',
              color: 'var(--color-text-secondary)',
              marginBottom: '4px',
              display: 'block'
            }}>
              Account
            </label>
            <select
              name="account"
              value={formData.account}
              onChange={handleChange}
              style={{
                width: '100%',
                backgroundColor: 'var(--color-background-primary)',
                border: '0.5px solid var(--color-border-secondary)',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '13px',
                color: 'var(--color-text-primary)',
                cursor: 'pointer'
              }}
            >
              <option value="Canara">Canara Bank</option>
              <option value="Union">Union Bank</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                border: '0.5px solid var(--color-border-secondary)',
                borderRadius: '8px',
                fontSize: '12px',
                cursor: 'pointer',
                backgroundColor: 'var(--color-background-primary)',
                color: 'var(--color-text-secondary)'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '8px 16px',
                border: '0.5px solid #185FA5',
                borderRadius: '8px',
                fontSize: '12px',
                cursor: 'pointer',
                backgroundColor: '#185FA5',
                color: 'white'
              }}
            >
              Add Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualEntryModal;
