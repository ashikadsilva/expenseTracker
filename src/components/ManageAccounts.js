import React from 'react';
import { getAccountBadgeStyle } from '../utils/accounts';
import { IconPencil, IconTrash } from './actionIcons';

const fmtInr = (n) => '₹' + Math.abs(Math.round(Number(n) || 0)).toLocaleString('en-IN');

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
        {accounts.map((a) => {
          const start = Number(a.startingBalance) || 0;
          const cur = Number(a.currentBalance) || 0;
          const curUp = cur >= start;
          return (
            <div
              key={a.id}
              className="cat-item"
              style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px', paddingTop: '10px', paddingBottom: '10px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                <span
                  aria-hidden
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: a.chipColor || '#888',
                    flexShrink: 0,
                  }}
                />
                <span className="cat-item-name" style={{ flex: 1, minWidth: 0 }}>
                  {a.label}
                </span>
                <div className="cat-item-actions" style={{ marginLeft: 'auto' }}>
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
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.5, paddingLeft: '18px' }}>
                <div>
                  Starting balance: <strong style={{ color: 'var(--color-text-primary)' }}>{fmtInr(start)}</strong>
                </div>
                <div>
                  Current balance:{' '}
                  <strong style={{ color: curUp ? '#3B6D11' : '#A32D2D' }}>{fmtInr(cur)}</strong>
                </div>
                <span
                  className="cat-badge"
                  style={{
                    ...getAccountBadgeStyle(a.id, accounts),
                    marginTop: 4,
                    display: 'inline-block',
                    fontSize: '10px',
                  }}
                >
                  {a.id}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    color: 'var(--color-text-secondary)',
                    display: 'block',
                    marginTop: 4,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={(a.keywords || []).join(', ')}
                >
                  {(a.keywords || []).join(', ')}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ManageAccounts;
