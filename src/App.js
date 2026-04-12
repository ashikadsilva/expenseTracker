import React, { useState, useEffect, useRef } from 'react';
import './styles.css';
import ManualEntryModal from './components/ManualEntryModal';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import CategoriesView from './components/CategoriesView';
import ManageCategories from './components/ManageCategories';
import ManageAccounts from './components/ManageAccounts';
import AccountModal from './components/AccountModal';
import ImportTab from './components/ImportTab';
import TransactionModal from './components/TransactionModal';
import CategoryModal from './components/CategoryModal';
import MonthlyStatement from './components/MonthlyStatement';
import AuthScreen from './components/AuthScreen';
import {
  loadAppData,
  saveAppData,
  DEFAULT_CATEGORIES,
  isCloudPersistenceEnabled,
  getSupabaseClient,
  LS_ET_TRANSACTIONS,
  LS_ET_SUMMARY,
  readStoredAccounts,
} from './utils/persistence';
import { budgetMonthYearToIsoKey } from './utils/monthKeys';
import { useWalkthrough } from './hooks/useWalkthrough';
import {
  normalizeAccounts,
  matchAccountFromSheetName,
  stripAccountNoiseFromSheetName,
} from './utils/accounts';

const PALETTE = ['#185FA5','#3B6D11','#BA7517','#534AB7','#0F6E56','#993556','#A32D2D','#D85A30','#D4537E','#639922','#888780','#E24B4A','#3266ad','#73726c','#1D9E75','#EF9F27','#97C459','#0C447C','#633806'];

/** Longer month names first so "march" is not read as "mar". */
const SHEET_MONTH_RE =
  /\b(january|february|march|april|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i;

const MONTH_TOKEN_TO_SHORT = {
  january: 'Jan',
  february: 'Feb',
  march: 'Mar',
  april: 'Apr',
  may: 'May',
  june: 'Jun',
  july: 'Jul',
  august: 'Aug',
  september: 'Sep',
  october: 'Oct',
  november: 'Nov',
  december: 'Dec',
  jan: 'Jan',
  feb: 'Feb',
  mar: 'Mar',
  apr: 'Apr',
  jun: 'Jun',
  jul: 'Jul',
  aug: 'Aug',
  sep: 'Sep',
  oct: 'Oct',
  nov: 'Nov',
  dec: 'Dec'
};

/**
 * Sheet titles like "Canara-Summary-Aug" contain "summary" → substring "mar" would
 * wrongly match /mar/ if we scan the raw name. Strip known tokens first, then match month.
 */
function extractMonthYearFromSheetName(sheetName, accounts) {
  const raw = String(sheetName);
  const lower = raw.toLowerCase();
  const normalized = stripAccountNoiseFromSheetName(raw, accounts)
    .replace(/[-_]/g, ' ')
    .replace(/\b20\d{2}\b/g, ' ');
  const monthMatch = normalized.match(SHEET_MONTH_RE);
  let month = 'Unknown';
  if (monthMatch) {
    const key = monthMatch[1].toLowerCase();
    month = MONTH_TOKEN_TO_SHORT[key] || 'Unknown';
  }
  const yearMatch = raw.match(/\b(20\d{2})\b/);
  let year = yearMatch ? yearMatch[1] : '2025';
  if (!yearMatch && monthMatch) {
    const m = monthMatch[1].toLowerCase();
    if (['jan', 'feb', 'mar', 'january', 'february', 'march'].includes(m) && !lower.includes('2025')) year = '2026';
  }
  return { month, year };
}

/** Transaction rows: account id for filters — Canara vs Union from sheet title. */
function txnAccountIdFromSheetName(sheetName) {
  return String(sheetName).toLowerCase().includes('canara') ? 'Canara' : 'Union';
}

function App() {
  const cloudAuth = isCloudPersistenceEnabled();
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(cloudAuth);
  const user = session?.user ?? null;

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
  const [accounts, setAccounts] = useState(() => normalizeAccounts(null));
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editAccount, setEditAccount] = useState(null);
  const accountsRef = useRef(accounts);
  const [showAddEntryModal, setShowAddEntryModal] = useState(false);
  const [viewMode, setViewMode] = useState('individual'); // 'individual' or 'combined'
  const [dataReady, setDataReady] = useState(false);

  useEffect(() => {
    if (!cloudAuth) {
      setAuthLoading(false);
      return;
    }
    const client = getSupabaseClient();
    if (!client) {
      setAuthLoading(false);
      return;
    }
    let mounted = true;
    client.auth.getSession().then(({ data: { session: s } }) => {
      if (mounted) {
        setSession(s);
        setAuthLoading(false);
      }
    });
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [cloudAuth]);

  useEffect(() => {
    if (authLoading) return;
    if (cloudAuth && !user) return;

    let cancelled = false;
    setDataReady(false);

    (async () => {
      try {
        const data = await loadAppData(cloudAuth ? user?.id : undefined);
        if (cancelled) return;
        setCategories(data.categories);
        setTransactions(data.transactions);
        setBudgetData(data.budgetData);
        setAccounts(data.accounts);
      } catch (error) {
        console.error('Error initializing data:', error);
        if (!cancelled) {
          setCategories({
            expense: [...DEFAULT_CATEGORIES.expense],
            income: [...DEFAULT_CATEGORIES.income],
          });
          setTransactions([]);
          setBudgetData([]);
          setAccounts(normalizeAccounts(null));
        }
      } finally {
        if (!cancelled) setDataReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, cloudAuth, user?.id]);

  useEffect(() => {
    if (!dataReady) return;
    saveAppData(
      transactions,
      categories,
      budgetData,
      cloudAuth ? user?.id : undefined,
      accounts
    );
  }, [transactions, categories, budgetData, accounts, dataReady, cloudAuth, user?.id]);

  useWalkthrough(user?.id, Boolean(dataReady && cloudAuth && user));

  useEffect(() => {
    accountsRef.current = accounts;
  }, [accounts]);

  useEffect(() => {
    const onStorage = (e) => {
      if (!e.newValue) return;
      try {
        if (e.key === LS_ET_TRANSACTIONS) {
          const arr = JSON.parse(e.newValue);
          if (Array.isArray(arr)) setTransactions(arr);
        }
        if (e.key === LS_ET_SUMMARY) {
          const arr = JSON.parse(e.newValue);
          if (Array.isArray(arr)) setBudgetData(arr);
        }
        if (e.key === LS_ET_ACCOUNTS || e.key === 'expenseTrackerAccounts') {
          const raw = readStoredAccounts();
          if (raw) setAccounts(normalizeAccounts(raw));
        }
      } catch {
        /* ignore */
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const openAccountModal = (acct) => {
    setEditAccount(acct || null);
    setShowAccountModal(true);
  };

  const closeAccountModal = () => {
    setShowAccountModal(false);
    setEditAccount(null);
  };

  const saveAccountRow = (payload) => {
    const { prevId, id, label, keywords, chipColor, startingBalance, currentBalance } = payload;
    const startB = Number(startingBalance) || 0;
    const curB =
      currentBalance !== undefined && currentBalance !== '' && currentBalance !== null
        ? Number(currentBalance) || 0
        : startB;
    const row = { id, label, keywords, chipColor, startingBalance: startB, currentBalance: curB };
    setAccounts((prev) => {
      if (prevId) {
        return prev.map((a) => (a.id === prevId ? row : a));
      }
      if (prev.some((a) => a.id === id)) {
        window.alert('That account ID already exists. Use a different ID.');
        return prev;
      }
      return [...prev, row];
    });
    closeAccountModal();
  };

  const txnBalanceDelta = (type, amount) =>
    (type === 'income' ? 1 : -1) * (Number(amount) || 0);

  const adjustAccountCurrentBalance = (accountId, delta) => {
    if (!accountId || !delta) return;
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === accountId
          ? { ...a, currentBalance: (Number(a.currentBalance) || 0) + delta }
          : a
      )
    );
  };

  const clearSummaryForReimport = () => {
    if (!window.confirm('Clear all summary data from this browser? You will need to upload your Excel file again to restore Monthly Statement and budget overview.')) return;
    try {
      localStorage.removeItem(LS_ET_SUMMARY);
      localStorage.removeItem('expenseTrackerBudgetData');
    } catch {
      /* ignore */
    }
    setBudgetData([]);
  };

  const deleteAccountRow = (id) => {
    if (accounts.length <= 1) {
      window.alert('Keep at least one account.');
      return;
    }
    if (
      !window.confirm(
        'Delete this account? Transactions and budget rows that use it will move to your first remaining account.'
      )
    ) {
      return;
    }
    const next = accounts.filter((a) => a.id !== id);
    const fallback = next[0].id;
    setTransactions((prev) =>
      prev.map((t) => (t.account === id ? { ...t, account: fallback } : t))
    );
    setBudgetData((prev) =>
      prev.map((b) => (b.account === id ? { ...b, account: fallback } : b))
    );
    setAccounts(next);
  };

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
    adjustAccountCurrentBalance(account, txnBalanceDelta(type, amount));
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
      const old = transactions.find((t) => t.id === editTxnId);
      setTransactions((prev) =>
        prev.map((t) => (t.id === editTxnId ? { ...t, ...txnData, type: currentTxnType } : t))
      );
      if (old) {
        adjustAccountCurrentBalance(old.account, -txnBalanceDelta(old.type, old.amount));
        const next = { ...old, ...txnData, type: currentTxnType };
        adjustAccountCurrentBalance(next.account, txnBalanceDelta(next.type, next.amount));
      }
    } else {
      setTransactions((prev) => {
        const newId = Math.max(...prev.map((t) => Number(t.id) || 0), 0) + 1;
        const row = { ...txnData, id: newId, type: currentTxnType };
        adjustAccountCurrentBalance(row.account, txnBalanceDelta(row.type, row.amount));
        return [...prev, row];
      });
    }
    closeTxnModal();
  };

  const deleteTxn = (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    const tx = transactions.find((t) => t.id === id);
    if (tx) adjustAccountCurrentBalance(tx.account, -txnBalanceDelta(tx.type, tx.amount));
    setTransactions((prev) => prev.filter((t) => t.id !== id));
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
          const acctList = accountsRef.current;
          const wb = XLSX.read(e.target.result, { type: 'array', cellDates: true });
          let imported = 0;
          let skipped = 0;
          
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

          /** Rows 0–3 are headers; from row index 4+. Expense cols 1–4; income cols 6–9 (date, amount, desc, category). */
          const parseTransactionSheet = (ws, sheetName) => {
            const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
            const out = [];
            const account = txnAccountIdFromSheetName(sheetName);
            for (let r = 4; r < rows.length; r++) {
              const row = rows[r];
              if (!row) continue;
              const dateE = row[1];
              const amtE = row[2];
              const descE = row[3];
              const catE = row[4];
              if (dateE != null && amtE != null && !Number.isNaN(parseFloat(amtE))) {
                const dateStr = parseExcelDate(dateE);
                const abs = Math.round(Math.abs(parseFloat(amtE)) * 100) / 100;
                if (dateStr && abs > 0) {
                  const cat = String(catE || 'Other').trim() || 'Other';
                  const desc = String(descE || '').trim();
                  out.push({ date: dateStr, amount: abs, desc, cat, account, type: 'expense' });
                }
              }
              const dateI = row[6];
              const amtI = row[7];
              const descI = row[8];
              const catI = row[9];
              if (dateI != null && amtI != null && !Number.isNaN(parseFloat(amtI))) {
                const dateStr = parseExcelDate(dateI);
                const abs = Math.round(Math.abs(parseFloat(amtI)) * 100) / 100;
                if (dateStr && abs > 0) {
                  const cat = String(catI || 'Other').trim() || 'Other';
                  const desc = String(descI || '').trim();
                  out.push({ date: dateStr, amount: abs, desc, cat, account, type: 'income' });
                }
              }
            }
            return out;
          };
          
          // Summary sheets: exact cell indices (0-based) per Monthly_budget.xlsx template
          const analyzeExcelData = (wb) => {
            const budgetData = [];

            wb.SheetNames.forEach((sheetName) => {
              const sheetNameLower = sheetName.toLowerCase();
              if (!sheetNameLower.includes('summary')) return;

              const ws = wb.Sheets[sheetName];
              if (!ws) return;

              const range = ws['!ref']
                ? XLSX.utils.decode_range(ws['!ref'])
                : { s: { r: 0, c: 0 }, e: { r: 120, c: 20 } };
              const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

              const getCell = (row, col) => {
                try {
                  const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
                  const cell = ws[cellAddress];
                  if (!cell) return null;
                  let value = cell.v;
                  if (cell.w && (value === null || value === undefined || value === '')) {
                    const cleanValue = String(cell.w).replace(/[^\d.-]/g, '');
                    value = parseFloat(cleanValue) || 0;
                  }
                  return typeof value === 'number' ? value : parseFloat(value) || 0;
                } catch {
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

              const account = matchAccountFromSheetName(sheetName, acctList);
              const { month, year } = extractMonthYearFromSheetName(sheetName, acctList);

              const startingBalance = Number(getCell(7, 11)) || 0;
              const startBalance = Number(getCell(16, 3)) || 0;
              const endBalance = Number(getCell(16, 4)) || 0;
              const savingsLabel = readText(13, 8) || 'No change';
              const savingsPct = Number(getCell(12, 8)) || 0;
              const savedThisMonth = Number(getCell(14, 8)) || 0;

              const totalExpensesPlanned = Number(getCell(20, 2)) || 0;
              let totalExpensesActual = Number(getCell(21, 2)) || 0;
              const totalIncomePlanned = Number(getCell(20, 8)) || 0;
              let totalIncomeActual = Number(getCell(21, 8)) || 0;

              const expenseCategories = [];
              const incomeCategories = [];

              const lastCatRow = Math.min(49, range.e.r);
              for (let i = 26; i <= lastCatRow; i++) {
                const row = rows[i];
                if (!row) continue;
                const expCat = row[1];
                const expPlanned = parseFloat(row[3]);
                const expActual = parseFloat(row[4]);
                const expDiff = parseFloat(row[5]);
                if (typeof expCat === 'string' && expCat.trim() && expCat.trim().toLowerCase() !== 'totals') {
                  const planned = Number.isFinite(expPlanned) ? expPlanned : 0;
                  const actual = Number.isFinite(expActual) ? expActual : 0;
                  const diff = Number.isFinite(expDiff) ? expDiff : actual - planned;
                  expenseCategories.push({
                    category: expCat.trim(),
                    planned,
                    actual,
                    diff,
                  });
                }
                const incCat = row[7];
                const incPlanned = parseFloat(row[9]);
                const incActual = parseFloat(row[10]);
                const incDiff = parseFloat(row[11]);
                if (typeof incCat === 'string' && incCat.trim()) {
                  const planned = Number.isFinite(incPlanned) ? incPlanned : 0;
                  const actual = Number.isFinite(incActual) ? incActual : 0;
                  const diff = Number.isFinite(incDiff) ? incDiff : actual - planned;
                  incomeCategories.push({
                    category: incCat.trim(),
                    planned,
                    actual,
                    diff,
                  });
                }
              }

              if (!totalExpensesActual) {
                totalExpensesActual = expenseCategories.reduce((s, c) => s + (Number(c.actual) || 0), 0);
              }
              if (!totalIncomeActual) {
                totalIncomeActual = incomeCategories.reduce((s, c) => s + (Number(c.actual) || 0), 0);
              }
              
              const netSavings = totalIncomeActual - totalExpensesActual;
              const calculatedEndBalance = startBalance + netSavings;
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
              
              const budgetItem = {
                sheet: sheetName,
                account,
                month,
                year,
                starting_balance: startingBalance,
                start_balance: startBalance,
                end_balance: endBalance,
                saved_this_month: savedThisMonth,
                savings_label: String(savingsLabel),
                savings_pct: parseFloat(savingsPct) || 0,
                total_expenses_planned: totalExpensesPlanned,
                total_expenses_actual: totalExpensesActual,
                total_income_planned: totalIncomePlanned,
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
                  starting_balance_source: startBalance > 0 ? 'excel_extracted' : 'not_found',
                  balance_calculation: `starting(${fmt(startBalance)}) + net_savings(${fmt(netSavings)}) = calculated(${fmt(calculatedEndBalance)})`,
                  actual_vs_calculated: `actual(${fmt(endBalance)}) vs calculated(${fmt(calculatedEndBalance)}) = variance(${fmt(balanceVariance)})`,
                  totals: {
                    total_expenses: totalExpensesActual,
                    total_income: totalIncomeActual,
                    net_savings: netSavings,
                    savings_rate: totalIncomeActual > 0 ? (netSavings / totalIncomeActual * 100) : 0
                  }
                }
              };
              
              budgetData.push(budgetItem);
            });

            const sheets = {};
            wb.SheetNames.forEach((name) => {
              if (!String(name).toLowerCase().includes('transaction')) return;
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
          
          const analysis = analyzeExcelData(wb);

          const candidates = [];
          wb.SheetNames.forEach((sheetName) => {
            const sheetAnalysis = analysis.sheets[sheetName];
            if (!sheetAnalysis || sheetAnalysis.type !== 'transactions') return;
            sheetAnalysis.transactions.forEach((t) => candidates.push(t));
          });

          setTransactions((prev) => {
            const keys = new Set(prev.map((t) => `${t.date}_${t.amount}_${t.account}_${t.type}`));
            let maxId = prev.reduce((m, t) => Math.max(m, Number(t.id) || 0), 0);
            const added = [];
            for (const transaction of candidates) {
              const key = `${transaction.date}_${transaction.amount}_${transaction.account}_${transaction.type}`;
              if (keys.has(key)) {
                skipped += 1;
                continue;
              }
              keys.add(key);
              maxId += 1;
              added.push({ id: maxId, ...transaction });
            }
            imported = added.length;
            if (added.length) {
              setCategories((pc) => {
                const exp = [...pc.expense];
                const inc = [...pc.income];
                const he = new Set(exp.map((c) => c.name));
                const hi = new Set(inc.map((c) => c.name));
                for (const tr of added) {
                  if (tr.type === 'expense' && !he.has(tr.cat)) {
                    he.add(tr.cat);
                    exp.push({ name: tr.cat, color: '#888780' });
                  }
                  if (tr.type === 'income' && !hi.has(tr.cat)) {
                    hi.add(tr.cat);
                    inc.push({ name: tr.cat, color: '#888780' });
                  }
                }
                return { expense: exp, income: inc };
              });
            }
            return [...prev, ...added];
          });
          
          if (analysis.budgetData && analysis.budgetData.length > 0) {
            setBudgetData(analysis.budgetData);
            if (
              window.confirm(
                'Update account balances from imported data? This sets each account\'s current balance to the latest end balance from the imported summary sheets.'
              )
            ) {
              const best = {};
              for (const row of analysis.budgetData) {
                const iso = budgetMonthYearToIsoKey(row.month, row.year);
                const acc = String(row.account || '');
                if (!acc || !iso) continue;
                if (!best[acc] || iso.localeCompare(best[acc].iso) >= 0) {
                  best[acc] = { iso, end: Number(row.end_balance) || 0 };
                }
              }
              setAccounts((prev) =>
                prev.map((a) => (best[a.id] ? { ...a, currentBalance: best[a.id].end } : a))
              );
            }
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
          
          const sum = analysis.summary || {};
          const x = sum.balanceSheets ?? 0;
          const resultMessage = `✓ ${x} summary sheet${x === 1 ? '' : 's'} loaded, ${imported} transaction${imported === 1 ? '' : 's'} imported (${skipped} duplicate${skipped === 1 ? '' : 's'} skipped)`;
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

  const signOut = async () => {
    const client = getSupabaseClient();
    if (client) await client.auth.signOut();
    window.location.reload();
  };

  if (authLoading) {
    return (
      <div className="auth-screen">
        <p className="auth-muted">Loading…</p>
      </div>
    );
  }

  if (cloudAuth && !user) {
    return <AuthScreen />;
  }

  if (!dataReady) {
    return (
      <div className="auth-screen">
        <p className="auth-muted">Loading your data…</p>
      </div>
    );
  }

  return (
    <div className="app app-relative">
      <div className="topbar" data-tour="topbar">
        <div className="topbar-left">
          <span className="topbar-title">My expense tracker</span>
          <span className="topbar-sub">
            {accounts.map((a) => a.label).join(' · ') || 'Your bank accounts'}
          </span>
        </div>
        <div className="topbar-right">
          <button
            type="button"
            className="btn btn-success"
            data-tour="btn-import"
            onClick={triggerUpload}
          >
            Import XLSX
          </button>
          <button type="button" className="btn btn-secondary" onClick={exportCSV}>
            Export CSV
          </button>
          <button
            type="button"
            className="btn btn-primary"
            data-tour="btn-add-entry"
            onClick={() => setShowAddEntryModal(true)}
          >
            + Add Entry
          </button>
          {cloudAuth ? (
            <button type="button" className="btn btn-secondary" onClick={signOut}>
              Sign out
            </button>
          ) : null}
        </div>
      </div>
      <input 
        type="file" 
        ref={fileInputRef}
        accept=".xlsx,.xls" 
        style={{display:'none'}} 
        onChange={handleXLSX}
      />

      <div className="tabs" data-tour="tabs">
        <div
          className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          data-tour="tab-dashboard"
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </div>
        <div className={`tab ${activeTab === 'transactions' ? 'active' : ''}`} onClick={() => setActiveTab('transactions')}>Transactions</div>
        <div className={`tab ${activeTab === 'categories-view' ? 'active' : ''}`} onClick={() => setActiveTab('categories-view')}>Categories</div>
        <div className={`tab ${activeTab === 'manage-cats' ? 'active' : ''}`} onClick={() => setActiveTab('manage-cats')}>Manage categories</div>
        <div className={`tab ${activeTab === 'manage-accts' ? 'active' : ''}`} onClick={() => setActiveTab('manage-accts')}>Manage accounts</div>
        <div className={`tab ${activeTab === 'monthly-statement' ? 'active' : ''}`} onClick={() => setActiveTab('monthly-statement')}>Monthly Statement</div>
        <div className={`tab ${activeTab === 'import-tab' ? 'active' : ''}`} onClick={() => setActiveTab('import-tab')}>Import</div>
      </div>

      {activeTab === 'dashboard' && (
        <Dashboard 
          transactions={transactions}
          categories={categories}
          accounts={accounts}
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
          accounts={accounts}
          getColor={getColor}
          fmt={fmt}
          getFiltered={getFiltered}
          getAllMonths={getAllMonths}
          budgetData={budgetData}
          openTxnModal={openTxnModal}
          deleteTxn={deleteTxn}
          getBalanceForMonth={getBalanceForMonth}
          calculateMonthlyBalances={calculateMonthlyBalances}
        />
      )}

      {activeTab === 'categories-view' && (
        <CategoriesView 
          transactions={transactions}
          categories={categories}
          accounts={accounts}
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

      {activeTab === 'manage-accts' && (
        <ManageAccounts
          accounts={accounts}
          openAccountModal={openAccountModal}
          deleteAccount={deleteAccountRow}
        />
      )}

      {activeTab === 'monthly-statement' && (
        <MonthlyStatement 
          budgetData={budgetData}
          accounts={accounts}
          getColor={getColor}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
      )}

      {activeTab === 'import-tab' && (
        <ImportTab 
          triggerUpload={triggerUpload}
          importResult={importResult}
          accountsSummary={accounts.map((a) => a.label).join(', ')}
          onClearSummaryForReimport={clearSummaryForReimport}
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
          accounts={accounts}
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
          accounts={accounts}
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

      {showAccountModal && (
        <AccountModal
          show={showAccountModal}
          onClose={closeAccountModal}
          onSave={saveAccountRow}
          editAccount={editAccount}
          palette={PALETTE}
        />
      )}
    </div>
  );
}

export default App;
