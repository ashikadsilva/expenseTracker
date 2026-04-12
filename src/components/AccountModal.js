import React, { useState, useEffect } from 'react';
import { slugify } from '../utils/accounts';

const AccountModal = ({ show, onClose, onSave, editAccount, palette }) => {
  const [id, setId] = useState('');
  const [label, setLabel] = useState('');
  const [keywordsText, setKeywordsText] = useState('');
  const [chipColor, setChipColor] = useState('#185FA5');
  const [startingBalance, setStartingBalance] = useState('');
  const [currentBalance, setCurrentBalance] = useState('');

  useEffect(() => {
    if (editAccount) {
      setId(editAccount.id);
      setLabel(editAccount.label);
      setKeywordsText((editAccount.keywords || []).join(', '));
      setChipColor(editAccount.chipColor || '#185FA5');
      setStartingBalance(
        editAccount.startingBalance !== undefined && editAccount.startingBalance !== null
          ? String(editAccount.startingBalance)
          : '0'
      );
      setCurrentBalance(
        editAccount.currentBalance !== undefined && editAccount.currentBalance !== null
          ? String(editAccount.currentBalance)
          : '0'
      );
    } else {
      setId('');
      setLabel('');
      setKeywordsText('');
      setChipColor(palette[0] || '#185FA5');
      setStartingBalance('0');
      setCurrentBalance('0');
    }
  }, [editAccount, show, palette]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedLabel = label.trim();
    if (!trimmedLabel) {
      window.alert('Enter a display name.');
      return;
    }
    const keywords = keywordsText
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (!keywords.length) {
      window.alert('Add at least one import keyword (comma-separated), e.g. canara, hdfc.');
      return;
    }
    let finalId = id.trim().slice(0, 40);
    if (!editAccount) {
      finalId = slugify(finalId || trimmedLabel);
    } else {
      finalId = editAccount.id;
    }
    if (!finalId) {
      window.alert('Account ID is invalid.');
      return;
    }
    onSave({
      prevId: editAccount ? editAccount.id : null,
      id: finalId,
      label: trimmedLabel,
      keywords,
      chipColor,
      startingBalance,
      currentBalance,
    });
  };

  if (!show) return null;

  return (
    <div className="modal-backdrop open" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">
          {editAccount ? 'Edit account' : 'New account'}
        </div>

        <form onSubmit={handleSubmit}>
          {!editAccount ? (
            <div className="form-row">
              <label className="form-label">Account ID (short name in data)</label>
              <input
                type="text"
                placeholder="e.g. HDFC — saved as slug if left blank"
                value={id}
                onChange={(e) => setId(e.target.value)}
              />
              <div className="form-hint">
                Used in exports and stored on each transaction. Letters, numbers, underscores.
              </div>
            </div>
          ) : (
            <div className="form-row">
              <label className="form-label">Account ID</label>
              <input type="text" value={editAccount.id} disabled />
            </div>
          )}

          <div className="form-row">
            <label className="form-label">Display name</label>
            <input
              type="text"
              placeholder="e.g. HDFC Bank"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <label className="form-label">Import keywords (comma-separated)</label>
            <input
              type="text"
              placeholder="e.g. hdfc, hdfc bank"
              value={keywordsText}
              onChange={(e) => setKeywordsText(e.target.value)}
            />
            <div className="form-hint">
              Sheet names from Excel are matched (case-insensitive). Longest match wins.
            </div>
          </div>

          <div className="form-row">
            <label className="form-label">Starting balance (₹)</label>
            <input
              type="number"
              step="0.01"
              inputMode="decimal"
              value={startingBalance}
              onChange={(e) => setStartingBalance(e.target.value)}
            />
            <div className="form-hint">Balance when you started tracking this account.</div>
          </div>

          <div className="form-row">
            <label className="form-label">Current balance (₹)</label>
            <input
              type="number"
              step="0.01"
              inputMode="decimal"
              value={currentBalance}
              onChange={(e) => setCurrentBalance(e.target.value)}
            />
            <div className="form-hint">Updated when you add transactions from + Add Entry, or manually here.</div>
          </div>

          <div className="form-row">
            <label className="form-label">Badge color</label>
            <div className="color-picker-row">
              {palette.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`color-swatch ${color === chipColor ? 'sel' : ''}`}
                  style={{ background: color }}
                  onClick={() => setChipColor(color)}
                  aria-label={`Color ${color}`}
                />
              ))}
            </div>
            <input
              type="color"
              value={chipColor}
              onChange={(e) => setChipColor(e.target.value)}
              style={{ marginTop: 8, width: '100%', height: 36 }}
            />
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

export default AccountModal;
