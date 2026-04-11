import React from 'react';
import { getAccountBadgeStyle } from '../utils/accounts';
import { IconPencil, IconTrash } from './actionIcons';

const ManageAccounts = ({ accounts, openAccountModal, deleteAccount }) => {
  return (
    <div className="section">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '.875rem',
        }}
      >
        <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          Bank accounts for filters, manual entry, and detecting the account from Excel sheet names.
        </span>
        <button type="button" className="btn btn-primary" onClick={() => openAccountModal()}>
          + New account
        </button>
      </div>

      <div
        style={{
          fontSize: '12px',
          fontWeight: '500',
          color: 'var(--color-text-secondary)',
          marginBottom: '.5rem',
          textTransform: 'uppercase',
          letterSpacing: '.4px',
        }}
      >
        Your accounts
      </div>
      <div className="cat-grid" id="bank-accounts">
        {accounts.map((a) => (
          <div key={a.id} className="cat-item">
            <span
              className="cat-badge"
              style={{
                ...getAccountBadgeStyle(a.id, accounts),
                marginRight: 6,
              }}
            >
              {a.id}
            </span>
            <span className="cat-item-name">{a.label}</span>
            <span
              style={{
                fontSize: '11px',
                color: 'var(--color-text-secondary)',
                flex: 1,
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={(a.keywords || []).join(', ')}
            >
              {(a.keywords || []).join(', ')}
            </span>
            <div className="cat-item-actions">
              <button
                type="button"
                className="icon-btn"
                aria-label={`Edit account ${a.label}`}
                onClick={() => openAccountModal(a)}
              >
                <IconPencil />
              </button>
              <button
                type="button"
                className="icon-btn"
                aria-label={`Delete account ${a.label}`}
                onClick={() => deleteAccount(a.id)}
              >
                <IconTrash />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManageAccounts;
