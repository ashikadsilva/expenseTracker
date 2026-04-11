import React, { useState, useEffect, useRef } from 'react';
import './styles.css';
import ManualEntryModal from './components/ManualEntryModal';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import CategoriesView from './components/CategoriesView';
import ManageCategories from './components/ManageCategories';
import ImportTab from './components/ImportTab';
import TransactionModal from './components/TransactionModal';
import CategoryModal from './components/CategoryModal';
import MonthlyStatement from './components/MonthlyStatement';
import { loadAppData, saveAppData, DEFAULT_CATEGORIES } from './utils/persistence';

const PALETTE = ['#185FA5','#3B6D11','#BA7517','#534AB7','#0F6E56','#993556','#A32D2D','#D85A30','#D4537E','#639922','#888780','#E24B4A','#3266ad','#73726c','#1D9E75','#EF9F27','#97C459','#0C447C','#633806'];

const SHEET_MONTH_RE = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i;

/**
 * Sheet titles like "Canara-Summary-Aug" contain "summary" → substring "mar" would
 * wrongly match /mar/ if we scan the raw name. Strip known tokens first, then match month.
 */
function extractMonthYearFromSheetName(sheetName) {
  const raw = String(sheetName);
  const lower = raw.toLowerCase();
  const normalized = lower
    .replace(/\b(summary|transactions|transaction|account|canara|union|other|bank)\b/gi, ' ')
    .replace(/[-_]/g, ' ')
    .replace(/\b20\d{2}\b/g, ' ');
  const monthMatch = normalized.match(SHEET_MONTH_RE);
  let month = 'Unknown';
  if (monthMatch) {
    const m = monthMatch[1].toLowerCase();
    month = m.charAt(0).toUpperCase() + m.slice(1);
  }
  const yearMatch = raw.match(/\b(20\d{2})\b/);
  let year = yearMatch ? yearMatch[1] : '2025';
  if (!yearMatch && monthMatch) {
    const m = monthMatch[1].toLowerCase();
    if (['jan', 'feb', 'mar'].includes(m) && !lower.includes('2025')) year = '2026';
  }
  return { month, year };
}

function App() {
  const [categories, setCategories] = useState({ expense: [], income: [] });
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showTxnModal, setShowTxnModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [editTxnId, setEditTxnId] = useState(null);
  const [editCatName, setEditCatName] = useState(null);
  const [editCatType, setEditCatType] = useState(null);
  const [categoryModalSource, setCategoryModalSource] = useState(null);
  const [selectedColor, setSelectedColor] = useState(PALETTE[0]);
  const [currentTxnType, setCurrentTxnType] = useState('expense');
  const [importResult, setImportResult] = useState('');
  const fileInputRef = useRef(null);
  const [budgetData, setBudgetData] = useState([]);
  const [showAddEntryModal, setShowAddEntryModal] = useState(false);
  const [viewMode, setViewMode] = useState('individual'); // 'individual' or 'combined'
  const [dataReady, setDataReady] = useState(false);

  // Load from Supabase (if configured) or localStorage once on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await loadAppData();
        if (cancelled) return;
        setCategories(data.categories);
        setTransactions(data.transactions);
        setBudgetData(data.budgetData);
      } catch (error) {
        console.error('Error initializing data:', error);
        if (!cancelled) {
          setCategories({
            expense: [...DEFAULT_CATEGORIES.expense],
            income: [...DEFAULT_CATEGORIES.income],
          });
          setTransactions([]);
          setBudgetData([]);
        }
      } finally {
        if (!cancelled) setDataReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // After first load, persist every change (localStorage + cloud)
  useEffect(() => {
    if (!dataReady) return;
    saveAppData(transactions, categories, budgetData);
  }, [transactions, categories, budgetData, dataReady]);

  const getColor = (cat) => {
    const all = [...categories.expense, ...categories.income];
    const found = all.find(c => c.name === cat);
    return found ? found.color : '#888780';
  };

  const getCatNames = (type) => {
    return categories[type].map(c => c.name);
  };

  const getAllMonths = () => {
    const months = [...new Set(transactions.map(t => t.date.substring(0,7)))].sort();
    return months;
  };

  const getFiltered = (filters) => {
    const { month = 'all', account = 'all', type = 'all', category = 'all', search = '' } = filters;
    return transactions.filter(t => {
      if (month !== 'all' && t.date.substring(0,7) !== month) return false;
      if (account !== 'all' && t.account !== account) return false;
      if (type !== 'all' && t.type !== type) return false;
      if (category !== 'all' && t.cat !== category) return false;
      if (search && !(t.desc || '').toLowerCase().includes(search.toLowerCase()) && !t.cat.toLowerCase().includes(search)) return false;
      return true;
    });
  };

  const fmt = (n) => {
    return '₹' + Math.round(n).toLocaleString('en-IN');
  };

  /** Running balance by calendar month from the transaction list (not from Excel budget sheets). */
  const calculateMonthlyBalances = (accountFilter = 'all') => {
    const monthlyData = {};
    const sortedTransactions = [...transactions]
      .filter((t) => accountFilter === 'all' || t.account === accountFilter)
      .sort((a, b) => a.date.localeCompare(b.date));

    sortedTransactions.forEach((t) => {
      const month = t.date.substring(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = {
          startBalance: 0,
          endBalance: 0,
          income: 0,
          expenses: 0,
          transactions: []
        };
      }
      
      monthlyData[month].transactions.push(t);
      monthlyData[month].income += t.type === 'income' ? t.amount : 0;
      monthlyData[month].expenses += t.type === 'expense' ? t.amount : 0;
    });
    
    // Calculate start and end balances for each month
    let runningBalance = 0;
    const months = Object.keys(monthlyData).sort();
    
    months.forEach(month => {
      monthlyData[month].startBalance = runningBalance;
      monthlyData[month].endBalance = runningBalance + monthlyData[month].income - monthlyData[month].expenses;
      runningBalance = monthlyData[month].endBalance;
    });
    
    return monthlyData;
  };

  const getBalanceForMonth = (month, accountFilter = 'all') => {
    const monthlyData = calculateMonthlyBalances(accountFilter);
    return monthlyData[month] || { startBalance: 0, endBalance: 0, income: 0, expenses: 0 };
  };

  // Budget data management functions
  const addManualEntry = (entry) => {
    const { date, amount, category, description, type, account } = entry;
    const dateObj = new Date(date);
    const month = dateObj.toLocaleString('default', { month: 'short' });
    const year = dateObj.getFullYear();
    const monthYearKey = `${month} ${year}`;
    
    // Find or create budget data for this month/account
    let budgetItem = budgetData.find(item => 
      item.month === month && 
      item.year === year.toString() && 
      item.account === account
    );
    
    if (!budgetItem) {
      // Create new budget item
      const prevBalance = getPreviousMonthBalance(month, year, account);
      budgetItem = {
        sheet: `${account} ${month} Summary`,
        account,
        month,
        year: year.toString(),
        starting_balance: prevBalance,
        start_balance: prevBalance,
        end_balance: prevBalance,
        saved_this_month: 0,
        savings_label: 'No change',
        savings_pct: 0,
        total_expenses_actual: 0,
        total_income_actual: 0,
        expense_categories: [],
        income_categories: []
      };
      setBudgetData(prev => [...prev, budgetItem]);
    }
    
    // Update the budget item
    if (type === 'expense') {
      budgetItem.total_expenses_actual += amount;
      budgetItem.end_balance = budgetItem.start_balance - budgetItem.total_expenses_actual + budgetItem.total_income_actual;
      
      // Update expense categories
      const existingCat = budgetItem.expense_categories.find(cat => cat.category === category);
      if (existingCat) {
        existingCat.actual += amount;
      } else {
        budgetItem.expense_categories.push({
          category,
          planned: 0,
          actual: amount,
          diff: amount
        });
      }
    } else {
      budgetItem.total_income_actual += amount;
      budgetItem.end_balance = budgetItem.start_balance - budgetItem.total_expenses_actual + budgetItem.total_income_actual;
      
      // Update income categories
      const existingCat = budgetItem.income_categories.find(cat => cat.category === category);
      if (existingCat) {
        existingCat.actual += amount;
      } else {
        budgetItem.income_categories.push({
          category,
          planned: 0,
          actual: amount,
          diff: amount
        });
      }
    }
    
    // Update savings calculations
    budgetItem.saved_this_month = budgetItem.end_balance - budgetItem.start_balance;
    budgetItem.savings_label = budgetItem.saved_this_month >= 0 ? 'Increase in total savings' : 'Decrease in total savings';
    budgetItem.savings_pct = budgetItem.start_balance !== 0 ? (budgetItem.saved_this_month / budgetItem.start_balance * 100) : 0;
    
    // Update budget data state
    setBudgetData(prev => prev.map(item => 
      item.sheet === budgetItem.sheet ? budgetItem : item
    ));
    
    // Also add to transactions for consistency
    const newTransaction = {
      id: Math.max(...transactions.map(t => t.id), 0) + 1,
      date,
      amount,
      desc: description,
      cat: category,
      account,
      type
    };
    
    setTransactions(prev => [...prev, newTransaction]);
  };

  const getPreviousMonthBalance = (month, year, account) => {
    const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIndex = monthOrder.indexOf(month);
    
    if (monthIndex === 0 && year === 2025) {
      return 0; // Starting point
    }
    
    let prevMonth, prevYear;
    if (monthIndex === 0) {
      prevMonth = 'Dec';
      prevYear = year - 1;
    } else {
      prevMonth = monthOrder[monthIndex - 1];
      prevYear = year;
    }
    
    const prevBudgetItem = budgetData.find(item => 
      item.month === prevMonth && 
      item.year === prevYear.toString() && 
      item.account === account
    );
    
    return prevBudgetItem ? prevBudgetItem.end_balance : 0;
  };

  const openTxnModal = (id = null) => {
    setEditTxnId(id);
    setCurrentTxnType('expense');
    setShowTxnModal(true);
  };

  const closeTxnModal = () => {
    setShowTxnModal(false);
    setEditTxnId(null);
  };

  const openCatModal = (name = null, type = null) => {
    setEditCatName(name);
    setEditCatType(type);
    setSelectedColor(PALETTE[0]);
    if (name && type) {
      const found = categories[type].find(c => c.name === name);
      if (found) setSelectedColor(found.color);
    }
    setShowCatModal(true);
  };

  const finishCatModal = () => {
    const src = categoryModalSource;
    setCategoryModalSource(null);
    setShowCatModal(false);
    setEditCatName(null);
    setEditCatType(null);
    if (src === 'manual') setShowAddEntryModal(true);
    if (src === 'txn') setShowTxnModal(true);
  };

  const saveTxn = (txnData) => {
    if (editTxnId) {
      setTransactions(prev => prev.map(t => 
        t.id === editTxnId ? { ...t, ...txnData, type: currentTxnType } : t
      ));
    } else {
      const newId = Math.max(...transactions.map(t => t.id), 0) + 1;
      setTransactions(prev => [...prev, { ...txnData, id: newId, type: currentTxnType }]);
    }
    closeTxnModal();
  };

  const deleteTxn = (id) => {
    if (window.confirm('Delete this transaction?')) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const saveCat = (catData) => {
    const { name, type } = catData;
    
    if (editCatName && editCatType) {
      // Edit existing category
      setCategories(prev => {
        const updated = { ...prev };
        const idx = updated[editCatType].findIndex(c => c.name === editCatName);
        if (idx >= 0) {
          updated[editCatType][idx] = { name, color: selectedColor };
          if (editCatType !== type) {
            updated[editCatType].splice(idx, 1);
            updated[type].push({ name, color: selectedColor });
          }
        }
        return updated;
      });
      
      // Update transactions with old category name
      setTransactions(prev => prev.map(t => 
        t.cat === editCatName ? { ...t, cat: name } : t
      ));
    } else {
      // Add new category
      const all = [...categories.expense, ...categories.income];
      if (all.some(c => c.name === name)) {
        alert('Category already exists.');
        return;
      }
      
      setCategories(prev => ({
        ...prev,
        [type]: [...prev[type], { name, color: selectedColor }]
      }));
    }
    
    finishCatModal();
  };

  const deleteCat = (name, type) => {
    if (!window.confirm(`Delete "${name}"? Transactions will keep the category name.`)) return;
    
    setCategories(prev => ({
      ...prev,
      [type]: prev[type].filter(c => c.name !== name)
    }));
  };

  const exportCSV = () => {
    const rows = [['Date', 'Description', 'Category', 'Amount', 'Type', 'Account']];
    const sorted = transactions.slice().sort((a,b) => b.date.localeCompare(a.date));
    sorted.forEach(t => rows.push([t.date, t.desc || '', t.cat, t.amount, t.type, t.account]));
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expenses.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleXLSX = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const XLSX = await import('xlsx');
      const reader = new FileReader();
      
      reader.onload = function(e) {
        try {
          const wb = XLSX.read(e.target.result, { type: 'array', cellDates: true });
          let imported = 0, skipped = 0;
          const existingKeys = new Set(transactions.map(t => `${t.date}_${t.amount}_${t.account}_${t.type}`));
          
          console.log('Workbook sheets found:', wb.SheetNames);

          const parseExcelDate = (val) => {
            if (val instanceof Date && !isNaN(val.getTime())) {
              const y = val.getFullYear();
              if (y < 2015 || y > 2040) return null;
              const m = String(val.getMonth() + 1).padStart(2, '0');
              const d = String(val.getDate()).padStart(2, '0');
              return `${y}-${m}-${d}`;
            }
            if (typeof val === 'number' && val > 20000 && val < 100000) {
              const dt = new Date(Math.round((val - 25569) * 86400 * 1000));
              if (isNaN(dt.getTime())) return null;
              const y = dt.getUTCFullYear();
              const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
              const d = String(dt.getUTCDate()).padStart(2, '0');
              return `${y}-${m}-${d}`;
            }
            if (typeof val === 'string' && /\d{4}-\d{2}-\d{2}/.test(val)) return val.trim().split(/\s+/)[0];
            return null;
          };

          const parseTransactionSheet = (ws, sheetName) => {
            const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
            const transactions = [];
            let account = 'Unknown';
            const sl = sheetName.toLowerCase();
            if (sl.includes('canara')) account = 'Canara';
            else if (sl.includes('union')) account = 'Union';
            else if (/\bother\b/i.test(sheetName)) account = 'Other';
            for (let r = 4; r < rows.length; r++) {
              const row = rows[r];
              if (!row) continue;
              const dateE = row[0];
              const amtE = row[1];
              const descE = row[2];
              const catE = row[3];
              if (dateE != null && amtE != null && !Number.isNaN(parseFloat(amtE))) {
                const dateStr = parseExcelDate(dateE);
                const abs = Math.round(Math.abs(parseFloat(amtE)) * 100) / 100;
                if (dateStr && abs > 0) {
                  const cat = String(catE || 'Other').trim() || 'Other';
                  const desc = String(descE || '').trim();
                  transactions.push({ date: dateStr, amount: abs, desc, cat, account, type: 'expense' });
                }
              }
              const dateI = row[5];
              const amtI = row[6];
              const descI = row[7];
              const catI = row[8];
              if (dateI != null && amtI != null && !Number.isNaN(parseFloat(amtI))) {
                const dateStr = parseExcelDate(dateI);
                const abs = Math.round(Math.abs(parseFloat(amtI)) * 100) / 100;
                if (dateStr && abs > 0) {
                  const cat = String(catI || 'Other').trim() || 'Other';
                  const desc = String(descI || '').trim();
                  transactions.push({ date: dateStr, amount: abs, desc, cat, account, type: 'income' });
                }
              }
            }
            return transactions;
          };
          
          // Budget-specific Excel Data Analysis using exact cell positions
          const analyzeExcelData = (wb) => {
            const budgetData = [];
            
            wb.SheetNames.forEach(sheetName => {
              const sheetNameLower = sheetName.toLowerCase();
              
              // Only process summary sheets (not transaction sheets)
              if (!sheetNameLower.includes('summary') && !sheetNameLower.includes('account')) {
                return;
              }
              
              // Try multiple methods to access worksheet
              let ws = wb.Sheets[sheetName];
              if (!ws) {
                console.warn(`Worksheet ${sheetName} not found in workbook`);
                console.log('Available sheets:', Object.keys(wb.Sheets));
                console.log('Workbook structure:', wb);
                return;
              }
              
              // Additional debugging
              console.log(`Worksheet ${sheetName} type:`, typeof ws);
              console.log(`Worksheet ${sheetName} keys:`, ws ? Object.keys(ws) : 'undefined');
              const range = ws['!ref'] ? XLSX.utils.decode_range(ws['!ref']) : { s: 'A1', e: { r: 0, c: 0 } };
              const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
              
              // Get cell values using exact positions with robust error handling and numeric parsing
              const getCell = (row, col) => {
                try {
                  const cellAddress = XLSX.utils.encode_cell({r: row, c: col});
                  const cell = ws[cellAddress];
                  if (!cell) return null;
                  
                  // Extract numeric value properly
                  let value = cell.v;
                  if (cell.w && !value) {
                    // Try to parse formatted string value
                    const cleanValue = String(cell.w).replace(/[^\d.-]/g, '');
                    value = parseFloat(cleanValue) || 0;
                  }
                  
                  // Ensure we return a number
                  return typeof value === 'number' ? value : (parseFloat(value) || 0);
                } catch (error) {
                  console.warn(`Error reading cell ${row},${col}:`, error);
                  return null;
                }
              };

              const readText = (row, col) => {
                try {
                  const cell = ws[XLSX.utils.encode_cell({ r: row, c: col })];
                  if (!cell || cell.v == null) return '';
                  return String(cell.v).trim();
                } catch {
                  return '';
                }
              };
              
              // Parse sheet name to extract account and month (avoid "mar" inside "Summary")
              let account = 'Unknown';
              if (sheetNameLower.includes('canara')) account = 'Canara';
              else if (sheetNameLower.includes('union')) account = 'Union';
              else if (sheetNameLower.includes('other')) account = 'Other';

              const { month, year } = extractMonthYearFromSheetName(sheetName);
              
              // Extract values using exact positions with fallback methods and debugging
              console.log(`Processing sheet: ${sheetName}`);
              console.log('Worksheet keys:', Object.keys(ws));
              
              // Monthly budget.xlsx: L8 / D17 = start; older templates: K/L area
              let startingBalance =
                getCell(7, 11) ||
                getCell(16, 3) ||
                getCell(6, 9) ||
                getCell(6, 10) ||
                getCell(7, 9) ||
                0;
              
              // Ensure starting balance is a number
              if (typeof startingBalance === 'string' && startingBalance.includes('Starting balance:')) {
                // Extract numeric value from string like "Starting balance: 5000"
                const numericMatch = startingBalance.match(/[\d,.-]+/);
                startingBalance = numericMatch ? parseFloat(numericMatch[0]) : 0;
              } else if (typeof startingBalance !== 'number') {
                startingBalance = parseFloat(startingBalance) || 0;
              }
              
              console.log(`Starting balance found: ${startingBalance}`);
              
              let endBalance =
                getCell(16, 4) ||
                getCell(15, 3) ||
                getCell(15, 4) ||
                0;
              
              // Ensure ending balance is a number
              if (typeof endBalance === 'string' && endBalance.includes('START BALANCE')) {
                // Extract numeric value from string like "START BALANCE 5000"
                const numericMatch = endBalance.match(/[\d,.-]+/);
                endBalance = numericMatch ? parseFloat(numericMatch[0]) : 0;
              } else if (typeof endBalance !== 'number') {
                endBalance = parseFloat(endBalance) || 0;
              }
              
              const savingsLabel =
                readText(13, 8) ||
                readText(12, 8) ||
                'No change';

              const savingsPct =
                getCell(12, 8) ||
                getCell(11, 8) ||
                getCell(11, 9) ||
                0;

              const savedThisMonth =
                getCell(14, 8) ||
                getCell(13, 8) ||
                getCell(13, 9) ||
                0;
              
              // Calculate totals from rows 27+
              let totalExpensesActual = 0;
              let totalIncomeActual = 0;
              const expenseCategories = [];
              const incomeCategories = [];
              
              // Monthly budget.xlsx: row 26 = Totals; categories from row 28 (index 27+). Cols A,D / G,J.
              for (let i = 27; i <= range.e.r; i++) {
                const row = rows[i];
                if (!row) continue;
                const expCat = row[0];
                const expPlanned = parseFloat(row[2]);
                const expActual = parseFloat(row[3]);
                const expDiff = parseFloat(row[4]);
                if (
                  typeof expCat === 'string' &&
                  expCat.trim() &&
                  expCat.trim().toLowerCase() !== 'totals' &&
                  !Number.isNaN(expActual) &&
                  expActual > 0
                ) {
                  const planned = Number.isNaN(expPlanned) ? 0 : expPlanned;
                  const diff = Number.isNaN(expDiff) ? 0 : expDiff;
                  expenseCategories.push({
                    category: expCat.trim(),
                    planned,
                    actual: expActual,
                    diff
                  });
                  totalExpensesActual += expActual;
                }
                const incCat = row[6];
                const incPlanned = parseFloat(row[7]);
                const incActual = parseFloat(row[9]);
                const incDiff = parseFloat(row[10]);
                if (typeof incCat === 'string' && incCat.trim() && !Number.isNaN(incActual) && incActual > 0) {
                  const planned = Number.isNaN(incPlanned) ? 0 : incPlanned;
                  const diff = Number.isNaN(incDiff) ? incActual - planned : incDiff;
                  incomeCategories.push({
                    category: incCat.trim(),
                    planned,
                    actual: incActual,
                    diff
                  });
                  totalIncomeActual += incActual;
                }
              }

              if (totalExpensesActual === 0) {
                totalExpensesActual = getCell(21, 2) || 0;
              }
              if (totalIncomeActual === 0) {
                totalIncomeActual = getCell(21, 8) || 0;
              }
              
              // Advanced budget analysis and validation
              const netSavings = totalIncomeActual - totalExpensesActual;
              const calculatedEndBalance = startingBalance + netSavings;
              const balanceVariance = endBalance - calculatedEndBalance;
              
              // Verify balance consistency
              const isBalanceConsistent = Math.abs(balanceVariance) < 0.01; // Allow small rounding differences
              
              // Category-wise variance analysis
              const expenseVariance = expenseCategories.map(cat => ({
                category: cat.category,
                planned: cat.planned || 0,
                actual: cat.actual || 0,
                variance: (cat.actual || 0) - (cat.planned || 0),
                variance_pct: cat.planned ? (((cat.actual || 0) - cat.planned) / cat.planned * 100) : 0
              }));
              
              const incomeVariance = incomeCategories.map(cat => ({
                category: cat.category,
                planned: cat.planned || 0,
                actual: cat.actual || 0,
                variance: (cat.actual || 0) - (cat.planned || 0),
                variance_pct: cat.planned ? (((cat.actual || 0) - cat.planned) / cat.planned * 100) : 0
              }));
              
              // Detect potential issues
              const issues = [];
              if (!isBalanceConsistent) {
                issues.push({
                  type: 'balance_mismatch',
                  severity: 'high',
                  message: `Balance mismatch: Calculated ending balance (${fmt(calculatedEndBalance)}) doesn't match actual ending balance (${fmt(endBalance)})`,
                  variance: balanceVariance
                });
              }
              
              if (totalExpensesActual === 0 && expenseCategories.length > 0) {
                issues.push({
                  type: 'expense_calculation',
                  severity: 'medium',
                  message: 'Expense categories found but total expenses calculated as 0'
                });
              }
              
              if (totalIncomeActual === 0 && incomeCategories.length > 0) {
                issues.push({
                  type: 'income_calculation',
                  severity: 'medium',
                  message: 'Income categories found but total income calculated as 0'
                });
              }
              
              // Create comprehensive budget data item
              const budgetItem = {
                sheet: sheetName,
                account,
                month,
                year,
                starting_balance: startingBalance,
                start_balance: startingBalance,
                end_balance: endBalance,
                saved_this_month: savedThisMonth,
                savings_label: String(savingsLabel),
                savings_pct: parseFloat(savingsPct) || 0,
                total_expenses_actual: totalExpensesActual,
                total_income_actual: totalIncomeActual,
                net_savings: netSavings,
                calculated_end_balance: calculatedEndBalance,
                balance_variance: balanceVariance,
                is_balance_consistent: isBalanceConsistent,
                expense_categories: expenseCategories,
                income_categories: incomeCategories,
                expense_variance: expenseVariance,
                income_variance: incomeVariance,
                issues: issues,
                analysis: {
                  starting_balance_source: startingBalance > 0 ? 'excel_extracted' : 'not_found',
                  balance_calculation: `starting(${fmt(startingBalance)}) + net_savings(${fmt(netSavings)}) = calculated(${fmt(calculatedEndBalance)})`,
                  actual_vs_calculated: `actual(${fmt(endBalance)}) vs calculated(${fmt(calculatedEndBalance)}) = variance(${fmt(balanceVariance)})`,
                  totals: {
                    total_expenses: totalExpensesActual,
                    total_income: totalIncomeActual,
                    net_savings: netSavings,
                    savings_rate: totalIncomeActual > 0 ? (netSavings / totalIncomeActual * 100) : 0
                  }
                }
              };
              
              console.log(`Budget analysis for ${sheetName}:`, {
                starting_balance: startingBalance,
                end_balance: endBalance,
                net_savings: netSavings,
                calculated_end_balance: calculatedEndBalance,
                balance_variance: balanceVariance,
                is_consistent: isBalanceConsistent,
                issues_count: issues.length
              });
              
              budgetData.push(budgetItem);
            });

            const sheets = {};
            wb.SheetNames.forEach((name) => {
              if (!/transaction/i.test(name)) return;
              const tws = wb.Sheets[name];
              if (!tws) return;
              const txs = parseTransactionSheet(tws, name);
              if (txs.length) sheets[name] = { type: 'transactions', transactions: txs };
            });

            const summary = {
              totalSheets: wb.SheetNames.length,
              transactionSheets: Object.keys(sheets).length,
              balanceSheets: budgetData.length,
              startingBalance: budgetData.reduce((s, b) => s + (Number(b.start_balance) || 0), 0),
              endingBalance: budgetData.reduce((s, b) => s + (Number(b.end_balance) || 0), 0),
              totalIncome: budgetData.reduce((s, b) => s + (Number(b.total_income_actual) || 0), 0),
              totalExpenses: budgetData.reduce((s, b) => s + (Number(b.total_expenses_actual) || 0), 0)
            };

            return { budgetData, sheets, summary };
          };
          
          const extractTransactionFromRow = (row, columns, sheetName) => {
            let dateCol, amountCol, descCol, catCol, typeCol;
            
            // Find columns by type detection
            columns.forEach(col => {
              if (col.type === 'date') dateCol = col.index;
              if (col.type === 'amount') amountCol = col.index;
              if (col.type === 'text') {
                const colName = String(col.name || '').toLowerCase();
                if (colName.includes('desc') || colName.includes('remark') || colName.includes('particular')) {
                  descCol = col.index;
                } else if (colName.includes('cat') || colName.includes('head') || colName.includes('type')) {
                  catCol = col.index;
                }
              }
            });
            
            // Extract and validate data
            const dateVal = dateCol !== undefined ? row[dateCol] : null;
            const amountVal = amountCol !== undefined ? row[amountCol] : null;
            const descVal = descCol !== undefined ? row[descCol] : null;
            const catVal = catCol !== undefined ? row[catCol] : null;
            
            if (!dateVal || !amountVal || isNaN(parseFloat(amountVal))) return null;
            
            // Format date
            let dateStr = '';
            if (dateVal instanceof Date) {
              const y = dateVal.getFullYear(), m = String(dateVal.getMonth() + 1).padStart(2, '0'), d = String(dateVal.getDate()).padStart(2, '0');
              if (y < 2020 || y > 2030) return null;
              dateStr = `${y}-${m}-${d}`;
            } else if (typeof dateVal === 'string' && dateVal.includes('-')) {
              dateStr = dateVal.split(' ')[0];
            } else return null;
            
            const amount = Math.round(parseFloat(amountVal) * 100) / 100;
            const type = amount < 0 ? 'expense' : 'income';
            const absAmount = Math.abs(amount);
            
            // Determine account from sheet name
            let account = 'Unknown';
            const sln = sheetName.toLowerCase();
            if (sln.includes('canara')) account = 'Canara';
            else if (sln.includes('union')) account = 'Union';
            else if (/\bother\b/i.test(sheetName)) account = 'Other';

            const cat = String(catVal || 'Other').trim() || 'Other';
            const desc = String(descVal || '').trim();
            
            return { date: dateStr, amount: absAmount, desc, cat, account, type };
          };
          
          // Analyze the Excel file
          const analysis = analyzeExcelData(wb);
          
          // Import transactions from all transaction sheets
          wb.SheetNames.forEach(sheetName => {
            const sheetAnalysis = analysis.sheets[sheetName];
            if (!sheetAnalysis || sheetAnalysis.type !== 'transactions') return;
            sheetAnalysis.transactions.forEach(transaction => {
              const key = `${transaction.date}_${transaction.amount}_${transaction.account}_${transaction.type}`;
              
              if (existingKeys.has(key)) { 
                skipped++; 
                return; 
              }
              existingKeys.add(key);
              
              const newId = Math.max(...transactions.map(t => t.id), 0) + 1;
              setTransactions(prev => [...prev, { id: newId, ...transaction }]);
              imported++;
              
              // Auto-add categories if they don't exist
              if (!categories[transaction.type].some(c => c.name === transaction.cat)) {
                setCategories(prev => ({
                  ...prev,
                  [transaction.type]: [...prev[transaction.type], { 
                    name: transaction.cat, 
                    color: '#888780' // Default color
                  }]
                }));
              }
            });
          });
          
          // Update balance information if found
          if (analysis.budgetData && analysis.budgetData.length > 0) {
            // Store budget data in state
            setBudgetData(analysis.budgetData);
            
            console.log('Budget data imported:', analysis.budgetData);
          }
          
          if (analysis.summary && analysis.summary.balanceSheets > 0) {
            const balanceInfo = {
              startingBalance: analysis.summary.startingBalance,
              endingBalance: analysis.summary.endingBalance,
              totalIncome: analysis.summary.totalIncome,
              totalExpenses: analysis.summary.totalExpenses,
              lastUpdated: new Date().toISOString()
            };
            localStorage.setItem('excelBalanceInfo', JSON.stringify(balanceInfo));
          }
          
          // Generate detailed import result
          const sum = analysis.summary || {};
          const resultMessage = `
Import Analysis Complete:
- Total Sheets: ${sum.totalSheets ?? 0}
- Transaction Sheets: ${sum.transactionSheets ?? 0}
- Balance Sheets: ${sum.balanceSheets ?? 0}
- New Transactions Imported: ${imported}
- Duplicates Skipped: ${skipped}
${(sum.balanceSheets ?? 0) > 0 ? `
Balance Information Found:
- Starting Balance: ${fmt(sum.startingBalance || 0)}
- Total Income: ${fmt(sum.totalIncome)}
- Total Expenses: ${fmt(sum.totalExpenses)}
- Ending Balance: ${fmt(sum.endingBalance || 0)}` : ''}
          `.trim();
          
          setImportResult(resultMessage);
          
        } catch (err) {
          setImportResult('Error reading Excel file: ' + err.message);
        }
      };
      
      reader.readAsArrayBuffer(file);
    } catch (err) {
      setImportResult('Error loading Excel file: ' + err.message);
    }
    
    event.target.value = '';
  };

  return (
    <div className="app app-relative">
      <div className="topbar">
        <div className="topbar-left">
          <span className="topbar-title">My expense tracker</span>
          <span className="topbar-sub">Canara, Union, other banks</span>
        </div>
        <div className="topbar-right">
          <button className="btn btn-success" onClick={triggerUpload}>Import XLSX</button>
          <button className="btn btn-secondary" onClick={exportCSV}>Export CSV</button>
          <button className="btn btn-primary" onClick={() => setShowAddEntryModal(true)}>+ Add Entry</button>
        </div>
      </div>
      <input 
        type="file" 
        ref={fileInputRef}
        accept=".xlsx,.xls" 
        style={{display:'none'}} 
        onChange={handleXLSX}
      />

      <div className="tabs">
        <div className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>Dashboard</div>
        <div className={`tab ${activeTab === 'transactions' ? 'active' : ''}`} onClick={() => setActiveTab('transactions')}>Transactions</div>
        <div className={`tab ${activeTab === 'categories-view' ? 'active' : ''}`} onClick={() => setActiveTab('categories-view')}>Categories</div>
        <div className={`tab ${activeTab === 'manage-cats' ? 'active' : ''}`} onClick={() => setActiveTab('manage-cats')}>Manage categories</div>
        <div className={`tab ${activeTab === 'monthly-statement' ? 'active' : ''}`} onClick={() => setActiveTab('monthly-statement')}>Monthly Statement</div>
        <div className={`tab ${activeTab === 'import-tab' ? 'active' : ''}`} onClick={() => setActiveTab('import-tab')}>Import</div>
      </div>

      {activeTab === 'dashboard' && (
        <Dashboard 
          transactions={transactions}
          categories={categories}
          getColor={getColor}
          fmt={fmt}
          getFiltered={getFiltered}
          getAllMonths={getAllMonths}
          calculateMonthlyBalances={calculateMonthlyBalances}
          getBalanceForMonth={getBalanceForMonth}
          budgetData={budgetData}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
      )}

      {activeTab === 'transactions' && (
        <Transactions 
          transactions={transactions}
          categories={categories}
          getColor={getColor}
          fmt={fmt}
          getFiltered={getFiltered}
          getAllMonths={getAllMonths}
          getCatNames={getCatNames}
          openTxnModal={openTxnModal}
          deleteTxn={deleteTxn}
          getBalanceForMonth={getBalanceForMonth}
        />
      )}

      {activeTab === 'categories-view' && (
        <CategoriesView 
          transactions={transactions}
          categories={categories}
          getColor={getColor}
          fmt={fmt}
          getFiltered={getFiltered}
          getAllMonths={getAllMonths}
        />
      )}

      {activeTab === 'manage-cats' && (
        <ManageCategories 
          categories={categories}
          openCatModal={openCatModal}
          deleteCat={deleteCat}
        />
      )}

      {activeTab === 'monthly-statement' && (
        <MonthlyStatement 
          budgetData={budgetData}
          viewMode={viewMode}
          setViewMode={setViewMode}
          transactions={transactions}
        />
      )}

      {activeTab === 'import-tab' && (
        <ImportTab 
          triggerUpload={triggerUpload}
          importResult={importResult}
        />
      )}

      {showTxnModal && (
        <TransactionModal
          show={showTxnModal}
          onClose={closeTxnModal}
          onSave={saveTxn}
          editTxnId={editTxnId}
          transactions={transactions}
          categories={categories}
          currentTxnType={currentTxnType}
          setCurrentTxnType={setCurrentTxnType}
          getCatNames={getCatNames}
          onAddCategory={(type) => {
            setCategoryModalSource('txn');
            setShowTxnModal(false);
            setEditCatName(null);
            setEditCatType(type);
            setSelectedColor(PALETTE[0]);
            setShowCatModal(true);
          }}
        />
      )}

      {showCatModal && (
        <CategoryModal
          show={showCatModal}
          onClose={finishCatModal}
          onSave={saveCat}
          editCatName={editCatName}
          editCatType={editCatType}
          selectedColor={selectedColor}
          setSelectedColor={setSelectedColor}
          palette={PALETTE}
        />
      )}

      {showAddEntryModal && (
        <ManualEntryModal
          show={showAddEntryModal}
          onClose={() => setShowAddEntryModal(false)}
          onSubmit={addManualEntry}
          categories={categories}
          onAddCategory={(type) => {
            setCategoryModalSource('manual');
            setShowAddEntryModal(false);
            setEditCatName(null);
            setEditCatType(type);
            setSelectedColor(PALETTE[0]);
            setShowCatModal(true);
          }}
        />
      )}
    </div>
  );
}

export default App;
