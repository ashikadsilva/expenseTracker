import React, { useState, useMemo, useCallback } from 'react'
import { useStore } from './useStore.js'
import { fmt, fmtMonth } from './constants.js'
import Dashboard from './components/Dashboard.jsx'
import Transactions from './components/Transactions.jsx'
import CategoriesView from './components/CategoriesView.jsx'
import ManageCategories from './components/ManageCategories.jsx'
import ImportTab from './components/ImportTab.jsx'
import TransactionModal from './components/TransactionModal.jsx'
import CategoryModal from './components/CategoryModal.jsx'
import { Select } from './components/UI.jsx'

const TABS = ['Dashboard', 'Transactions', 'Categories', 'Manage categories', 'Import']

export default function App() {
  const store = useStore()
  const [activeTab, setActiveTab] = useState('Dashboard')

  // Dashboard filters (global so they persist across tab switch)
  const [dashMonth, setDashMonth] = useState('all')
  const [dashAccount, setDashAccount] = useState('all')

  // Transaction modal
  const [txnModalOpen, setTxnModalOpen] = useState(false)
  const [editingTxn, setEditingTxn] = useState(null)

  // Category modal
  const [catModalOpen, setCatModalOpen] = useState(false)
  const [editingCat, setEditingCat] = useState(null)

  const allMonths = useMemo(() => {
    return [...new Set(store.transactions.map(t => t.date.substring(0,7)))].sort()
  }, [store.transactions])

  // Export CSV
  const exportCSV = useCallback(() => {
    const header = ['Date','Description','Category','Amount','Type','Account']
    const rows = store.transactions
      .slice()
      .sort((a,b) => b.date.localeCompare(a.date))
      .map(t => [t.date, t.desc||'', t.cat, t.amount, t.type, t.account])
    const csv = [header, ...rows]
      .map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type:'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `expenses_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [store.transactions])

  // Transaction modal handlers
  const openAddTxn = () => { setEditingTxn(null); setTxnModalOpen(true) }
  const openEditTxn = (t) => { setEditingTxn(t); setTxnModalOpen(true) }
  const saveTxn = (data) => {
    if (editingTxn) store.updateTransaction(editingTxn.id, data)
    else store.addTransaction(data)
  }

  // Category modal handlers
  const openAddCat = () => { setEditingCat(null); setCatModalOpen(true) }
  const openEditCat = (c) => { setEditingCat(c); setCatModalOpen(true) }
  const saveCat = ({ name, type, color }) => {
    if (editingCat) {
      store.updateCategory(editingCat.name, editingCat.type, name, type, color)
    } else {
      const all = [...store.categories.expense, ...store.categories.income]
      if (all.some(c => c.name === name)) { alert('Category already exists.'); return }
      store.addCategory(name, type, color)
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-tertiary)' }}>
      <div style={{
        maxWidth:900, margin:'0 auto',
        background:'var(--bg-primary)',
        minHeight:'100vh',
        boxShadow:'0 0 0 0.5px var(--border-light)'
      }}>
        {/* Top bar */}
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'0.875rem 1.25rem',
          borderBottom:'0.5px solid var(--border-light)',
          flexWrap:'wrap', gap:8
        }}>
          <div>
            <div style={{ fontSize:17, fontWeight:500, color:'var(--text-primary)' }}>
              My expense tracker
            </div>
            <div style={{ fontSize:12, color:'var(--text-secondary)' }}>
              Canara Bank &amp; Union Bank
            </div>
          </div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            <button
              onClick={() => { setActiveTab('Import') }}
              style={{
                display:'inline-flex', alignItems:'center', gap:5,
                border:'0.5px solid #97C459', borderRadius:8, padding:'7px 14px',
                fontSize:12, fontWeight:500, cursor:'pointer',
                background:'#EAF3DE', color:'#3B6D11', fontFamily:'inherit'
              }}
            >
              ↑ Import XLSX
            </button>
            <button
              onClick={exportCSV}
              style={{
                display:'inline-flex', alignItems:'center', gap:5,
                border:'0.5px solid var(--border-medium)', borderRadius:8, padding:'7px 14px',
                fontSize:12, fontWeight:500, cursor:'pointer',
                background:'var(--bg-secondary)', color:'var(--text-primary)', fontFamily:'inherit'
              }}
            >
              ↓ Export CSV
            </button>
            <button
              onClick={openAddTxn}
              style={{
                display:'inline-flex', alignItems:'center', gap:5,
                border:'none', borderRadius:8, padding:'7px 14px',
                fontSize:12, fontWeight:500, cursor:'pointer',
                background:'#185FA5', color:'#fff', fontFamily:'inherit'
              }}
            >
              + Add expense
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display:'flex', borderBottom:'0.5px solid var(--border-light)',
          padding:'0 1.25rem', overflowX:'auto'
        }}>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding:'9px 14px', fontSize:13, fontWeight:500, cursor:'pointer',
                color: activeTab===tab ? '#185FA5' : 'var(--text-secondary)',
                borderBottom: activeTab===tab ? '2px solid #185FA5' : '2px solid transparent',
                marginBottom:'-0.5px', background:'none', border:'none',
                whiteSpace:'nowrap', fontFamily:'inherit'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ padding:'1rem 1.25rem' }}>

          {activeTab === 'Dashboard' && (
            <>
              <div style={{ display:'flex', gap:6, marginBottom:'0.875rem', flexWrap:'wrap' }}>
                <Select value={dashMonth} onChange={setDashMonth}>
                  <option value="all">All months</option>
                  {allMonths.map(m => <option key={m} value={m}>{fmtMonth(m)}</option>)}
                </Select>
                <Select value={dashAccount} onChange={setDashAccount}>
                  <option value="all">Both accounts</option>
                  <option value="Canara">Canara Bank</option>
                  <option value="Union">Union Bank</option>
                </Select>
              </div>
              <Dashboard
                transactions={store.transactions}
                getColor={store.getColor}
                filterMonth={dashMonth}
                filterAccount={dashAccount}
              />
            </>
          )}

          {activeTab === 'Transactions' && (
            <Transactions
              transactions={store.transactions}
              getColor={store.getColor}
              onAdd={openAddTxn}
              onEdit={openEditTxn}
              onDelete={store.deleteTransaction}
              allMonths={allMonths}
            />
          )}

          {activeTab === 'Categories' && (
            <CategoriesView
              transactions={store.transactions}
              getColor={store.getColor}
              allMonths={allMonths}
            />
          )}

          {activeTab === 'Manage categories' && (
            <ManageCategories
              categories={store.categories}
              onAdd={openAddCat}
              onEdit={openEditCat}
              onDelete={store.deleteCategory}
            />
          )}

          {activeTab === 'Import' && (
            <ImportTab
              onImport={store.importTransactions}
              ensureCategory={store.ensureCategory}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <TransactionModal
        open={txnModalOpen}
        onClose={() => setTxnModalOpen(false)}
        onSave={saveTxn}
        transaction={editingTxn}
        categories={store.categories}
      />

      <CategoryModal
        open={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        onSave={saveCat}
        category={editingCat}
      />
    </div>
  )
}
