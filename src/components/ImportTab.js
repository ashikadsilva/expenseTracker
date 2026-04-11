import React from 'react';

const ImportTab = ({ triggerUpload, importResult, accountsSummary = '' }) => {
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
        <div style={{ marginTop: '.875rem' }}>
          <button 
            className="btn btn-primary" 
            onClick={(e) => { 
              e.stopPropagation(); 
              triggerUpload(); 
            }}
          >
            Choose file
          </button>
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
          Sheets named with "Transactions" are read. Expenses are in columns B\u2013E (Date, Amount, Description, Category). Income is in columns F\u2013I. The account is guessed from each sheet name using the import keywords you set per account. Duplicate dates+amounts are skipped automatically.
        </div>
      </div>
    </div>
  );
};

export default ImportTab;
