import React, { useState, useEffect, useRef } from 'react';
import './styles.css';
import ManualEntryModal from './components/ManualEntryModal';
import { loadData, saveData } from './utils/supabase';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import CategoriesView from './components/CategoriesView';
import ManageCategories from './components/ManageCategories';
import ImportTab from './components/ImportTab';
import TransactionModal from './components/TransactionModal';
import CategoryModal from './components/CategoryModal';

const PALETTE = ['#185FA5','#3B6D11','#BA7517','#534AB7','#0F6E56','#993556','#A32D2D','#D85A30','#D4537E','#639922','#888780','#E24B4A','#3266ad','#73726c','#1D9E75','#EF9F27','#97C459','#0C447C','#633806'];

const initialCategories = {
  expense: [
    {name:'Food',color:'#185FA5'},{name:'Home',color:'#3B6D11'},{name:'Shopping',color:'#BA7517'},
    {name:'SIP',color:'#534AB7'},{name:'Transportation',color:'#0F6E56'},{name:'Recharge',color:'#993556'},
    {name:'Investment',color:'#A32D2D'},{name:'Gifts',color:'#D85A30'},{name:'Health/medical',color:'#D4537E'},
    {name:'Travel',color:'#639922'},{name:'Utilities',color:'#888780'},{name:'Debt',color:'#E24B4A'},
    {name:'Rent',color:'#3266ad'},{name:'Other',color:'#73726c'},{name:'Union',color:'#1D9E75'},
    {name:'Mom',color:'#EF9F27'},{name:'Trip',color:'#97C459'},
  ],
  income: [
    {name:'Paycheck',color:'#3B6D11'},{name:'Credited Amount',color:'#185FA5'},{name:'Savings',color:'#534AB7'},
    {name:'Bonus',color:'#BA7517'},{name:'Interest',color:'#0F6E56'},{name:'Reward',color:'#D85A30'},
  ]
};

const initialTransactions = [
  {id:1,date:'2025-08-01',desc:'Transportation',cat:'Transportation',amount:500,type:'expense',account:'Canara'},
  {id:2,date:'2025-08-01',desc:'Cake',cat:'Home',amount:500,type:'expense',account:'Canara'},
  {id:3,date:'2025-08-01',desc:'Jeans Gift',cat:'Gifts',amount:2048,type:'expense',account:'Canara'},
  {id:4,date:'2025-08-03',desc:'PostOffice Investment',cat:'Investment',amount:60000,type:'expense',account:'Canara'},
  {id:5,date:'2025-08-08',desc:'Food',cat:'Food',amount:120,type:'expense',account:'Canara'},
  {id:6,date:'2025-08-09',desc:'Mom',cat:'Mom',amount:2000,type:'expense',account:'Canara'},
  {id:7,date:'2025-08-18',desc:'Birthday gift',cat:'Gifts',amount:1997,type:'expense',account:'Canara'},
  {id:8,date:'2025-08-23',desc:'Recharge',cat:'Recharge',amount:300.9,type:'expense',account:'Canara'},
  {id:9,date:'2025-08-25',desc:'Savana',cat:'Shopping',amount:1298,type:'expense',account:'Canara'},
  {id:10,date:'2025-08-04',desc:'Salary',cat:'Paycheck',amount:30000,type:'income',account:'Canara'},
  {id:11,date:'2025-08-06',desc:'Food',cat:'Food',amount:445,type:'expense',account:'Union'},
  {id:12,date:'2025-08-09',desc:'Meat',cat:'Home',amount:942,type:'expense',account:'Union'},
  {id:13,date:'2025-08-13',desc:'Rent',cat:'Rent',amount:6300,type:'expense',account:'Union'},
  {id:14,date:'2025-08-28',desc:'Ancilla',cat:'Shopping',amount:580,type:'expense',account:'Union'},
  {id:15,date:'2025-09-01',desc:'Dresses mom sister',cat:'Shopping',amount:2258,type:'expense',account:'Union'},
  {id:16,date:'2025-09-03',desc:'SIP',cat:'SIP',amount:2500,type:'expense',account:'Canara'},
  {id:17,date:'2025-09-13',desc:'Rent',cat:'Rent',amount:6300,type:'expense',account:'Union'},
  {id:18,date:'2025-09-16',desc:'Blood report',cat:'Health/medical',amount:3180,type:'expense',account:'Canara'},
  {id:19,date:'2025-09-23',desc:'Naukri',cat:'Other',amount:408,type:'expense',account:'Canara'},
  {id:20,date:'2025-09-25',desc:'Food shared',cat:'Food',amount:490,type:'expense',account:'Canara'},
  {id:21,date:'2025-09-29',desc:'Salary',cat:'Paycheck',amount:30000,type:'income',account:'Canara'},
  {id:22,date:'2025-10-01',desc:'SIP',cat:'SIP',amount:3500,type:'expense',account:'Canara'},
  {id:23,date:'2025-10-08',desc:'Travel Canara',cat:'Travel',amount:4052,type:'expense',account:'Canara'},
  {id:24,date:'2025-10-14',desc:'Rent',cat:'Rent',amount:6300,type:'expense',account:'Union'},
  {id:25,date:'2025-10-17',desc:'Myntra',cat:'Gifts',amount:1169,type:'expense',account:'Canara'},
  {id:26,date:'2025-10-28',desc:'Doctor',cat:'Health/medical',amount:7900,type:'expense',account:'Canara'},
  {id:27,date:'2025-10-10',desc:'Phone',cat:'Other',amount:18749,type:'expense',account:'Union'},
  {id:28,date:'2025-11-01',desc:'SIP',cat:'SIP',amount:3501,type:'expense',account:'Canara'},
  {id:29,date:'2025-11-13',desc:'Rent',cat:'Rent',amount:6300,type:'expense',account:'Union'},
  {id:30,date:'2025-11-22',desc:'ATM cash',cat:'Transportation',amount:300,type:'expense',account:'Canara'},
  {id:31,date:'2025-11-22',desc:'Ancilla Post Office',cat:'Investment',amount:5000,type:'expense',account:'Canara'},
  {id:32,date:'2025-11-21',desc:'Union transfer',cat:'Credited Amount',amount:10000,type:'income',account:'Canara'},
  {id:33,date:'2025-11-28',desc:'Shopping',cat:'Shopping',amount:6841,type:'expense',account:'Union'},
  {id:34,date:'2025-12-01',desc:'SIP',cat:'SIP',amount:3500,type:'expense',account:'Canara'},
  {id:35,date:'2025-12-03',desc:'Debt repayment',cat:'Debt',amount:6600,type:'expense',account:'Canara'},
  {id:36,date:'2025-12-14',desc:'Union Bank transfer',cat:'Union',amount:6100,type:'expense',account:'Canara'},
  {id:37,date:'2025-12-14',desc:'Rent',cat:'Rent',amount:6300,type:'expense',account:'Union'},
  {id:38,date:'2025-12-19',desc:'Sandals',cat:'Shopping',amount:1100,type:'expense',account:'Canara'},
  {id:39,date:'2025-12-29',desc:'Subscription',cat:'Utilities',amount:950,type:'expense',account:'Union'},
  {id:40,date:'2026-01-02',desc:'SIP',cat:'SIP',amount:3000,type:'expense',account:'Canara'},
  {id:41,date:'2026-01-13',desc:'Rent',cat:'Rent',amount:6300,type:'expense',account:'Union'},
  {id:42,date:'2026-01-24',desc:'Post Office',cat:'Investment',amount:5000,type:'expense',account:'Canara'},
  {id:43,date:'2026-01-26',desc:'Parcel food',cat:'Food',amount:2050,type:'expense',account:'Canara'},
  {id:44,date:'2026-01-08',desc:'Transfer received',cat:'Credited Amount',amount:16000,type:'income',account:'Canara'},
  {id:45,date:'2026-02-01',desc:'SIP',cat:'SIP',amount:5000,type:'expense',account:'Canara'},
  {id:46,date:'2026-02-01',desc:'ATM cash',cat:'Transportation',amount:1500,type:'expense',account:'Canara'},
  {id:47,date:'2026-02-14',desc:'Rent',cat:'Rent',amount:6300,type:'expense',account:'Union'},
  {id:48,date:'2026-02-04',desc:'Food shared',cat:'Food',amount:380,type:'expense',account:'Canara'},
  {id:49,date:'2026-02-13',desc:'Cash home',cat:'Home',amount:2000,type:'expense',account:'Canara'},
  {id:50,date:'2026-02-20',desc:'Transfer received',cat:'Credited Amount',amount:10000,type:'income',account:'Union'},
];

function App() {
  const [categories, setCategories] = useState(initialCategories);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showTxnModal, setShowTxnModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [editTxnId, setEditTxnId] = useState(null);
  const [editCatName, setEditCatName] = useState(null);
  const [editCatType, setEditCatType] = useState(null);
  const [selectedColor, setSelectedColor] = useState(PALETTE[0]);
  const [currentTxnType, setCurrentTxnType] = useState('expense');
  const [importResult, setImportResult] = useState('');
  const fileInputRef = useRef(null);
  const [budgetData, setBudgetData] = useState([]);
  const [showAddEntryModal, setShowAddEntryModal] = useState(false);

  // Load data from cloud/localStorage on mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        const data = await loadData();
        setCategories(data.categories);
        setTransactions(data.transactions);
        setBudgetData(data.budgetData);
      } catch (error) {
        console.error('Error initializing data:', error);
        // Fallback to empty state
        setCategories({ expense: [], income: [] });
        setTransactions([]);
        setBudgetData([]);
      }
    };
    
    initializeData();
  }, []);

  // Save data to cloud and localStorage whenever it changes
  useEffect(() => {
    saveData(transactions, categories, budgetData);
  }, [transactions, categories, budgetData]);

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

  const calculateMonthlyBalances = () => {
    const monthlyData = {};
    const sortedTransactions = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
    
    // Calculate running balance for each month
    sortedTransactions.forEach(t => {
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
      
      const amount = t.type === 'expense' ? -t.amount : t.amount;
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

  const getBalanceForMonth = (month) => {
    const monthlyData = calculateMonthlyBalances();
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

  const closeCatModal = () => {
    setShowCatModal(false);
    setEditCatName(null);
    setEditCatType(null);
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
    
    closeCatModal();
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
          
          // Dynamic Excel Data Analysis
          const analyzeExcelData = (wb) => {
            const analysis = {
              sheets: {},
              summary: {
                totalSheets: wb.SheetNames.length,
                transactionSheets: 0,
                balanceSheets: 0,
                startingBalance: 0,
                totalIncome: 0,
                totalExpenses: 0,
                endingBalance: 0
              }
            };
            
            wb.SheetNames.forEach(sheetName => {
              const ws = wb.Sheets[sheetName];
              const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
              
              const sheetAnalysis = {
                name: sheetName,
                type: 'unknown',
                rowCount: rows.length,
                columns: [],
                hasDates: false,
                hasAmounts: false,
                hasBalance: false,
                startingBalance: null,
                endingBalance: null,
                transactions: []
              };
              
              // Analyze first few rows to detect column types
              if (rows.length > 0) {
                const headerRow = rows[0] || [];
                const sampleRows = rows.slice(1, Math.min(5, rows.length));
                
                // Detect column types dynamically
                headerRow.forEach((header, colIndex) => {
                  const colName = String(header || '').toLowerCase();
                  const colData = {
                    index: colIndex,
                    name: header,
                    type: 'unknown',
                    sampleValues: []
                  };
                  
                  // Check sample values in this column
                  sampleRows.forEach(row => {
                    const value = row && row[colIndex];
                    if (value != null && value !== '') {
                      colData.sampleValues.push(value);
                      
                      // Detect column type
                      if (value instanceof Date || (typeof value === 'string' && value.match(/\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}/))) {
                        colData.type = 'date';
                        sheetAnalysis.hasDates = true;
                      } else if (!isNaN(parseFloat(value)) && parseFloat(value) !== 0) {
                        colData.type = 'amount';
                        sheetAnalysis.hasAmounts = true;
                      } else if (typeof value === 'string' && value.toLowerCase().includes('balance')) {
                        colData.type = 'balance';
                        sheetAnalysis.hasBalance = true;
                      } else if (typeof value === 'string') {
                        colData.type = 'text';
                      }
                    }
                  });
                  
                  sheetAnalysis.columns.push(colData);
                });
                
                // Determine sheet type
                const sheetNameLower = sheetName.toLowerCase();
                if (sheetNameLower.includes('transaction') || sheetNameLower.includes('expense') || sheetNameLower.includes('income')) {
                  sheetAnalysis.type = 'transactions';
                  analysis.summary.transactionSheets++;
                } else if (sheetNameLower.includes('balance') || sheetNameLower.includes('summary') || sheetNameLower.includes('account')) {
                  sheetAnalysis.type = 'balance';
                  analysis.summary.balanceSheets++;
                }
                
                // Extract transactions from transaction sheets
                if (sheetAnalysis.type === 'transactions') {
                  rows.forEach((row, i) => {
                    if (i === 0 || !row || row.length === 0) return; // Skip header and empty rows
                    
                    const transaction = extractTransactionFromRow(row, sheetAnalysis.columns, sheetName);
                    if (transaction) {
                      sheetAnalysis.transactions.push(transaction);
                    }
                  });
                }
                
                // Extract balance information from balance sheets
                if (sheetAnalysis.type === 'balance') {
                  rows.forEach((row, i) => {
                    if (!row || row.length === 0) return;
                    
                    row.forEach((cell, colIndex) => {
                      const col = sheetAnalysis.columns[colIndex];
                      if (!col) return;
                      
                      const cellStr = String(cell || '').toLowerCase();
                      const cellValue = parseFloat(cell);
                      
                      if (!isNaN(cellValue)) {
                        if (cellStr.includes('opening') || cellStr.includes('starting') || cellStr.includes('beginning')) {
                          sheetAnalysis.startingBalance = cellValue;
                        } else if (cellStr.includes('closing') || cellStr.includes('ending') || cellStr.includes('final')) {
                          sheetAnalysis.endingBalance = cellValue;
                        } else if (col.type === 'amount' && !cellStr.includes('balance')) {
                          // This might be income/expense data
                          if (cellValue > 0) {
                            analysis.summary.totalIncome += cellValue;
                          } else {
                            analysis.summary.totalExpenses += Math.abs(cellValue);
                          }
                        }
                      }
                    });
                  });
                }
              }
              
              analysis.sheets[sheetName] = sheetAnalysis;
            });
            
            return analysis;
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
            if (sheetName.toLowerCase().includes('canara')) account = 'Canara';
            else if (sheetName.toLowerCase().includes('union')) account = 'Union';
            
            const cat = String(catVal || 'Other').trim() || 'Other';
            const desc = String(descVal || '').trim();
            
            return { date: dateStr, amount: absAmount, desc, cat, account, type };
          };
          
          // Analyze the Excel file
          const analysis = analyzeExcelData(wb);
          
          // Import transactions from all transaction sheets
          wb.SheetNames.forEach(sheetName => {
            const sheetAnalysis = analysis.sheets[sheetName];
            if (sheetAnalysis.type === 'transactions') {
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
            }
          });
          
          // Update balance information if found
          if (analysis.summary.balanceSheets > 0) {
            let totalStartingBalance = 0;
            let totalEndingBalance = 0;
            
            Object.values(analysis.sheets).forEach(sheet => {
              if (sheet.type === 'balance') {
                if (sheet.startingBalance !== null) totalStartingBalance += sheet.startingBalance;
                if (sheet.endingBalance !== null) totalEndingBalance += sheet.endingBalance;
              }
            });
            
            // Store balance information in localStorage or state
            const balanceInfo = {
              startingBalance: totalStartingBalance,
              endingBalance: totalEndingBalance,
              totalIncome: analysis.summary.totalIncome,
              totalExpenses: analysis.summary.totalExpenses,
              lastUpdated: new Date().toISOString()
            };
            
            localStorage.setItem('excelBalanceInfo', JSON.stringify(balanceInfo));
          }
          
          // Generate detailed import result
          const resultMessage = `
Import Analysis Complete:
- Total Sheets: ${analysis.summary.totalSheets}
- Transaction Sheets: ${analysis.summary.transactionSheets}
- Balance Sheets: ${analysis.summary.balanceSheets}
- New Transactions Imported: ${imported}
- Duplicates Skipped: ${skipped}
${analysis.summary.balanceSheets > 0 ? `
Balance Information Found:
- Starting Balance: ${fmt(analysis.summary.startingBalance || 0)}
- Total Income: ${fmt(analysis.summary.totalIncome)}
- Total Expenses: ${fmt(analysis.summary.totalExpenses)}
- Ending Balance: ${fmt(analysis.summary.endingBalance || 0)}` : ''}
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
          <span className="topbar-sub">Canara Bank & Union Bank</span>
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
        />
      )}

      {showCatModal && (
        <CategoryModal
          show={showCatModal}
          onClose={closeCatModal}
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
        />
      )}
    </div>
  );
}

export default App;
