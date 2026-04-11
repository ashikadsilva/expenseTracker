import React from 'react';

const MonthlyStatement = ({ budgetData, viewMode, setViewMode }) => {
  const CAT_COLORS = ['#185FA5','#3B6D11','#BA7517','#534AB7','#0F6E56','#993556','#A32D2D','#D85A30','#D4537E','#639922','#888780','#E24B4A','#3266ad','#73726c','#1D9E75','#EF9F27','#97C459','#0C447C'];

  const fmt = (n) => {
    if (n === null || n === undefined) return '₹';
    return '₹' + Math.abs(Math.round(n)).toLocaleString('en-IN');
  };

  const fmtSigned = (n) => {
    if (n === null || n === undefined) return '₹';
    const sign = n >= 0 ? '+' : '-';
    return sign + '₹' + Math.abs(Math.round(n)).toLocaleString('en-IN');
  };

  const pct = (n) => (n * 100).toFixed(1) + '%';

  const getFilteredBudgetData = () => {
    if (!budgetData || budgetData.length === 0) return [];
    
    if (viewMode === 'combined') {
      // Combine data by month
      const combined = {};
      
      budgetData.forEach(item => {
        const monthKey = `${item.month} ${item.year}`;
        if (!combined[monthKey]) {
          combined[monthKey] = {
            month: item.month,
            year: item.year,
            sheets: [],
            combinedStartBalance: 0,
            combinedEndBalance: 0,
            combinedIncome: 0,
            combinedExpenses: 0,
            combinedNetSavings: 0,
            combinedIssues: [],
            combinedCategories: { expense: {}, income: {} }
          };
        }
        
        const monthData = combined[monthKey];
        monthData.sheets.push(item);
        monthData.combinedStartBalance += item.start_balance || 0;
        monthData.combinedEndBalance += item.end_balance || 0;
        monthData.combinedIncome += item.total_income_actual || 0;
        monthData.combinedExpenses += item.total_expenses_actual || 0;
        monthData.combinedNetSavings += (item.net_savings || 0);
        
        // Combine issues from all sheets
        if (item.issues && item.issues.length > 0) {
          monthData.combinedIssues.push(...item.issues);
        }
        
        // Combine expense categories
        (item.expense_categories || []).forEach(cat => {
          if (!monthData.combinedCategories.expense[cat.category]) {
            monthData.combinedCategories.expense[cat.category] = { planned: 0, actual: 0, diff: 0 };
          }
          monthData.combinedCategories.expense[cat.category].planned += cat.planned || 0;
          monthData.combinedCategories.expense[cat.category].actual += cat.actual || 0;
          monthData.combinedCategories.expense[cat.category].diff += cat.diff || 0;
        });
        
        // Combine income categories
        (item.income_categories || []).forEach(cat => {
          if (!monthData.combinedCategories.income[cat.category]) {
            monthData.combinedCategories.income[cat.category] = { planned: 0, actual: 0, diff: 0 };
          }
          monthData.combinedCategories.income[cat.category].planned += cat.planned || 0;
          monthData.combinedCategories.income[cat.category].actual += cat.actual || 0;
          monthData.combinedCategories.income[cat.category].diff += cat.diff || 0;
        });
      });
      
      return Object.values(combined);
    } else {
      // Return individual sheets
      return budgetData;
    }
  };

  const renderStatementCard = (item, isCombined = false) => {
    const startBalance = isCombined ? item.combinedStartBalance : (item.start_balance || 0);
    const endBalance = isCombined ? item.combinedEndBalance : (item.end_balance || 0);
    const totalIncome = isCombined ? item.combinedIncome : (item.total_income_actual || 0);
    const totalExpenses = isCombined ? item.combinedExpenses : (item.total_expenses_actual || 0);
    const difference = endBalance - startBalance;
    
    // Enhanced analysis data
    const netSavings = isCombined ? item.combinedNetSavings : (item.net_savings || 0);
    const calculatedEndBalance = startBalance + netSavings;
    const balanceVariance = endBalance - calculatedEndBalance;
    const isBalanceConsistent = Math.abs(balanceVariance) < 0.01;
    const issues = isCombined ? (item.combinedIssues || []) : (item.issues || []);

    const expenseCategories = isCombined 
      ? Object.entries(item.combinedCategories.expense).map(([name, data]) => ({ category: name, ...data }))
      : (item.expense_categories || []);
    
    const incomeCategories = isCombined 
      ? Object.entries(item.combinedCategories.income).map(([name, data]) => ({ category: name, ...data }))
      : (item.income_categories || []);

    return (
      <div key={isCombined ? `${item.month}-${item.year}` : item.sheet} 
           style={{
             backgroundColor: 'var(--color-background-primary)',
             border: '0.5px solid var(--color-border-tertiary)',
             borderRadius: '12px',
             padding: '1rem',
             marginBottom: '16px'
           }}>
        
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div>
            <span style={{ fontSize: '14px', fontWeight: '500' }}>
              {isCombined ? `${item.month} ${item.year} (Combined)` : `${item.month} ${item.year}`}
            </span>
            {!isCombined && (
              <span style={{
                marginLeft: '8px',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: '500',
                backgroundColor: item.account === 'Canara' ? '#E6F1FB' : '#E1F5EE',
                color: item.account === 'Canara' ? '#0C447C' : '#085041'
              }}>
                {item.account}
              </span>
            )}
          </div>
          {!isCombined && item.savings_label && (
            <span style={{
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '11px',
              fontWeight: '500',
              backgroundColor: item.saved_this_month >= 0 ? '#EAF3DE' : '#FCEBEB',
              color: item.saved_this_month >= 0 ? '#3B6D11' : '#A32D2D'
            }}>
              {item.savings_label}: {fmtSigned(item.saved_this_month)}
            </span>
          )}
        </div>

        {/* Summary Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '8px',
          marginBottom: '12px'
        }}>
          <div style={{
            backgroundColor: 'var(--color-background-secondary)',
            borderRadius: '8px',
            padding: '0.875rem'
          }}>
            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
              Starting balance
            </div>
            <div style={{ fontSize: '15px', fontWeight: '500', color: '#185FA5' }}>
              {fmt(startBalance)}
            </div>
          </div>
          
          <div style={{
            backgroundColor: 'var(--color-background-secondary)',
            borderRadius: '8px',
            padding: '0.875rem'
          }}>
            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
              Total income
            </div>
            <div style={{ fontSize: '15px', fontWeight: '500', color: '#3B6D11' }}>
              {fmt(totalIncome)}
            </div>
          </div>
          
          <div style={{
            backgroundColor: 'var(--color-background-secondary)',
            borderRadius: '8px',
            padding: '0.875rem'
          }}>
            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
              Total spent
            </div>
            <div style={{ fontSize: '15px', fontWeight: '500', color: '#A32D2D' }}>
              {fmt(totalExpenses)}
            </div>
          </div>
          
          <div style={{
            backgroundColor: 'var(--color-background-secondary)',
            borderRadius: '8px',
            padding: '0.875rem'
          }}>
            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
              Ending balance
            </div>
            <div style={{ fontSize: '15px', fontWeight: '500', color: endBalance >= startBalance ? '#3B6D11' : '#A32D2D' }}>
              {fmt(endBalance)}
            </div>
          </div>
          
          <div style={{
            backgroundColor: 'var(--color-background-secondary)',
            borderRadius: '8px',
            padding: '0.875rem'
          }}>
            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
              Difference
            </div>
            <div style={{ fontSize: '15px', fontWeight: '500', color: difference >= 0 ? '#3B6D11' : '#A32D2D' }}>
              {fmtSigned(difference)}
            </div>
          </div>
          
          {!isCombined && item.savings_pct !== undefined && (
            <div style={{
              backgroundColor: 'var(--color-background-secondary)',
              borderRadius: '8px',
              padding: '0.875rem'
            }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                Savings %
              </div>
              <div style={{ fontSize: '15px', fontWeight: '500', color: item.saved_this_month >= 0 ? '#3B6D11' : '#A32D2D' }}>
                {pct(item.savings_pct)}
              </div>
            </div>
          )}
        </div>

        {/* Issues and Analysis */}
        {issues && issues.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <div style={{
              backgroundColor: '#FFF3CD',
              border: '1px solid #FFA500',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '8px'
            }}>
              <div style={{ fontSize: '12px', fontWeight: '500', color: '#D32F2F', marginBottom: '8px' }}>
                ⚠️ Budget Analysis Issues Detected
              </div>
              <div style={{ fontSize: '11px', color: '#D32F2F' }}>
                {issues.map((issue, index) => (
                  <div key={index} style={{ marginBottom: '4px' }}>
                    <strong>{issue.type.replace('_', ' ').toUpperCase()}:</strong> {issue.message}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Balance Consistency Check */}
        {!isBalanceConsistent && (
          <div style={{
            backgroundColor: '#E3F2FD',
            border: '1px solid #1976D2',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '12px'
          }}>
            <div style={{ fontSize: '12px', fontWeight: '500', color: '#1976D2', marginBottom: '8px' }}>
              📊 Balance Consistency Check
            </div>
            <div style={{ fontSize: '11px', color: '#1976D2' }}>
              <div style={{ marginBottom: '4px' }}>
                <strong>Starting Balance:</strong> {fmt(startBalance)}
              </div>
              <div style={{ marginBottom: '4px' }}>
                <strong>Net Savings:</strong> {fmt(netSavings)}
              </div>
              <div style={{ marginBottom: '4px' }}>
                <strong>Calculated End Balance:</strong> {fmt(calculatedEndBalance)}
              </div>
              <div style={{ marginBottom: '4px' }}>
                <strong>Actual End Balance:</strong> {fmt(endBalance)}
              </div>
              <div style={{ marginBottom: '4px' }}>
                <strong>Variance:</strong> 
                <span style={{ color: Math.abs(balanceVariance) < 0.01 ? '#3B6D11' : '#A32D2D' }}>
                  {fmtSigned(balanceVariance)}
                </span>
              </div>
              <div style={{ fontSize: '10px', color: '#1976D2', marginTop: '8px' }}>
                {Math.abs(balanceVariance) < 0.01 ? '✅ Balance is consistent' : '⚠️ Balance variance detected'}
              </div>
            </div>
          </div>
        )}
        
        {/* Expense Categories */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{
            fontSize: '11px',
            fontWeight: '500',
            color: 'var(--color-text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '8px'
          }}>
            Expense Categories
          </div>
          <div style={{
            border: '0.5px solid var(--color-border-tertiary)',
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr',
              padding: '7px 12px',
              backgroundColor: 'var(--color-background-secondary)',
              fontSize: '11px',
              fontWeight: '500',
              color: 'var(--color-text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.4px'
            }}>
              <span>Category</span>
              <span style={{ textAlign: 'right' }}>Planned</span>
              <span style={{ textAlign: 'right' }}>Actual</span>
              <span style={{ textAlign: 'right' }}>Difference</span>
            </div>
            {expenseCategories
              .filter(cat => cat.actual > 0)
              .sort((a, b) => b.actual - a.actual)
              .map((cat, i) => (
                <div key={cat.category} style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr',
                  padding: '8px 12px',
                  borderTop: '0.5px solid var(--color-border-tertiary)',
                  fontSize: '13px',
                  alignItems: 'center'
                }}>
                  <span style={{ fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: CAT_COLORS[i % CAT_COLORS.length],
                      flexShrink: 0
                    }}></span>
                    {cat.category}
                  </span>
                  <span style={{ textAlign: 'right', color: 'var(--color-text-secondary)' }}>
                    {fmt(cat.planned)}
                  </span>
                  <span style={{ textAlign: 'right', color: 'var(--color-text-secondary)' }}>
                    {fmt(cat.actual)}
                  </span>
                  <span style={{ textAlign: 'right', fontWeight: '500', color: cat.diff >= 0 ? '#3B6D11' : '#A32D2D' }}>
                    {fmtSigned(cat.diff)}
                  </span>
                  <span style={{ textAlign: 'right', fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                    ({cat.diff >= 0 ? '+' : ''}{cat.planned ? Math.abs(cat.diff / cat.planned * 100).toFixed(1) : 0}%)
                  </span>
                </div>
              ))}
            {expenseCategories.filter(cat => cat.actual > 0).length === 0 && (
              <div style={{
                padding: '12px',
                textAlign: 'center',
                fontSize: '12px',
                color: 'var(--color-text-secondary)'
              }}>
                No expense data
              </div>
            )}
          </div>
        </div>

        {/* Income Categories */}
        <div>
          <div style={{
            fontSize: '11px',
            fontWeight: '500',
            color: 'var(--color-text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '8px'
          }}>
            Income Categories
          </div>
          <div style={{
            border: '0.5px solid var(--color-border-tertiary)',
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr',
              padding: '7px 12px',
              backgroundColor: 'var(--color-background-secondary)',
              fontSize: '11px',
              fontWeight: '500',
              color: 'var(--color-text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.4px'
            }}>
              <span>Category</span>
              <span style={{ textAlign: 'right' }}>Planned</span>
              <span style={{ textAlign: 'right' }}>Actual</span>
              <span style={{ textAlign: 'right' }}>Difference</span>
            </div>
            {incomeCategories
              .filter(cat => cat.actual > 0)
              .sort((a, b) => b.actual - a.actual)
              .map((cat, i) => (
                <div key={cat.category} style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr',
                  padding: '8px 12px',
                  borderTop: '0.5px solid var(--color-border-tertiary)',
                  fontSize: '13px',
                  alignItems: 'center'
                }}>
                  <span style={{ fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: ['#3B6D11', '#185FA5', '#534AB7', '#0F6E56', '#BA7517'][i % 5],
                      flexShrink: 0
                    }}></span>
                    {cat.category}
                  </span>
                  <span style={{ textAlign: 'right', color: 'var(--color-text-secondary)' }}>
                    {fmt(cat.planned)}
                  </span>
                  <span style={{ textAlign: 'right', color: 'var(--color-text-secondary)' }}>
                    {fmt(cat.actual)}
                  </span>
                  <span style={{ textAlign: 'right', fontWeight: '500', color: '#3B6D11' }}>
                    {fmtSigned(cat.diff)}
                  </span>
                  <span style={{ textAlign: 'right', fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                    ({cat.diff >= 0 ? '+' : ''}{cat.planned ? Math.abs(cat.diff / cat.planned * 100).toFixed(1) : 0}%)
                  </span>
                </div>
              ))}
            {incomeCategories.filter(cat => cat.actual > 0).length === 0 && (
              <div style={{
                padding: '12px',
                textAlign: 'center',
                fontSize: '12px',
                color: 'var(--color-text-secondary)'
              }}>
                No income data
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const filteredData = getFilteredBudgetData();

  return (
    <div>
      {/* View Toggle */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem'
      }}>
        <div style={{
          fontSize: '12px',
          fontWeight: '500',
          color: 'var(--color-text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.4px'
        }}>
          Monthly Statements
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setViewMode('individual')}
            style={{
              padding: '6px 12px',
              border: viewMode === 'individual' ? '0.5px solid #185FA5' : '0.5px solid var(--color-border-secondary)',
              borderRadius: '8px',
              fontSize: '12px',
              cursor: 'pointer',
              backgroundColor: viewMode === 'individual' ? '#185FA5' : 'var(--color-background-primary)',
              color: viewMode === 'individual' ? 'white' : 'var(--color-text-primary)'
            }}
          >
            Per sheet
          </button>
          <button
            onClick={() => setViewMode('combined')}
            style={{
              padding: '6px 12px',
              border: viewMode === 'combined' ? '0.5px solid #185FA5' : '0.5px solid var(--color-border-secondary)',
              borderRadius: '8px',
              fontSize: '12px',
              cursor: 'pointer',
              backgroundColor: viewMode === 'combined' ? '#185FA5' : 'var(--color-background-primary)',
              color: viewMode === 'combined' ? 'white' : 'var(--color-text-primary)'
            }}
          >
            Combined by month
          </button>
        </div>
      </div>

      {/* Statement Cards */}
      {filteredData.length > 0 ? (
        filteredData.map(item => renderStatementCard(item, viewMode === 'combined'))
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          color: 'var(--color-text-secondary)',
          fontSize: '14px'
        }}>
          No budget data available. Upload an Excel file to see statements.
        </div>
      )}
    </div>
  );
};

export default MonthlyStatement;
