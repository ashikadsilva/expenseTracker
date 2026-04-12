import React from 'react';

const ImportTab = ({ triggerUpload, importResult, accountsSummary = '', onClearSummaryForReimport }) => {
  return (
    <div className="section">
      <div className="upload-zone" onClick={triggerUpload}>
        <div className="upload-icon">📂</div>
        <div className="upload-title">Upload your Monthly_budget.xlsx</div>
        <div className="upload-sub">
          Reads transaction sheets automatically.
          {accountsSummary
            ? ` Account names are detected using your keywords (${accountsSummary}).`
            : ' Configure accounts under Manage accounts.'}
        </div>
        <div style={{ marginTop: '.875rem', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <button 
            className="btn btn-primary" 
            onClick={(e) => { 
              e.stopPropagation(); 
              triggerUpload(); 
            }}
          >
            Choose file
          </button>
          {typeof onClearSummaryForReimport === 'function' && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={(e) => {
                e.stopPropagation();
                onClearSummaryForReimport();
                triggerUpload();
              }}
            >
              Clear & re-import summary
            </button>
          )}
        </div>
      </div>
      
      {importResult && (
        <div 
          style={{ 
            padding: '.75rem', 
            background: importResult.includes('Error') ? '#FCEBEB' : '#EAF3DE', 
            borderRadius: 'var(--border-radius-md)', 
            color: importResult.includes('Error') ? '#A32D2D' : '#3B6D11', 
            fontSize: '13px',
            marginTop: '.5rem'
          }}
          dangerouslySetInnerHTML={{ __html: importResult }}
        />
      )}
      
      <div style={{ 
        marginTop: '1rem', 
        padding: '.875rem', 
        background: 'var(--color-background-secondary)', 
        borderRadius: 'var(--border-radius-md)' 
      }}>
        <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--color-text-secondary)', marginBottom: '.5rem' }}>
          How import works
        </div>
        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.7' }}>
          Sheet names must include <strong>Transaction</strong> (case-insensitive; e.g. Canara Transactions) for line items to import. Expenses are in columns B\u2013E (Date, Amount, Description, Category). Income is in columns F\u2013I. The account is guessed from each sheet name using the keywords you set under Manage accounts. Summary sheets still fill Budget Overview without transaction sheets.
        </div>
      </div>
    </div>
  );
};

export default ImportTab;
