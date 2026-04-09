import React, { useState, useEffect } from 'react';

const CategoryModal = ({ 
  show, 
  onClose, 
  onSave, 
  editCatName, 
  editCatType, 
  selectedColor, 
  setSelectedColor, 
  palette 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense'
  });

  useEffect(() => {
    setFormData({
      name: editCatName || '',
      type: editCatType || 'expense'
    });
  }, [editCatName, editCatType]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Enter a name.');
      return;
    }
    
    onSave({
      name: formData.name.trim(),
      type: formData.type
    });
  };

  const pickColor = (color) => {
    setSelectedColor(color);
  };

  if (!show) return null;

  return (
    <div className="modal-backdrop open" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">
          {editCatName ? 'Edit category' : 'New category'}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label className="form-label">Category name</label>
            <input 
              type="text" 
              placeholder="e.g. Gym"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          
          <div className="form-row">
            <label className="form-label">Type</label>
            <select 
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          
          <div className="form-row">
            <label className="form-label">Color</label>
            <div className="color-picker-row">
              {palette.map(color => (
                <div 
                  key={color}
                  className={`color-swatch ${color === selectedColor ? 'sel' : ''}`}
                  style={{ background: color }}
                  onClick={() => pickColor(color)}
                />
              ))}
            </div>
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

export default CategoryModal;
