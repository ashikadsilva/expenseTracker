import React, { useMemo, useState } from 'react'
import { Btn, CatBadge, Select, EmptyState, SummaryStrip } from './UI.jsx'
import { fmt, fmtMonth } from '../constants.js'

export default function Transactions({ transactions, getColor, onAdd, onEdit, onDelete, allMonths }) {
  const [month, setMonth] = useState('all')
  const [account, setAccount] = useState('all')
  const [type, setType] = useState('all')
  const [cat, setCat] = useState('all')
  const [search, setSearch] = useState('')

  const allCats = useMemo(() => [...new Set(transactions.map(t=>t.cat))].sort(), [transactions])

  const filtered = useMemo(() => transactions.filter(t => {
    if (month !== 'all' && !t.date.startsWith(month)) return false
    if (account !== 'all' && t.account !== account) return false
    if (type !== 'all' && t.type !== type) return false
    if (cat !== 'all' && t.cat !== cat) return false
    if (search && !(t.desc||'').toLowerCase().includes(search.toLowerCase()) && !t.cat.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }).sort((a,b) => b.date.localeCompare(a.date)), [transactions, month, account, type, cat, search])

  const totE = filtered.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0)
  const totI = filtered.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0)

  const colStyle = { gridTemplateColumns:'90px 1fr 110px 90px 56px' }

  return (
    <div>
      <div style={{ display:'flex', gap:6, marginBottom:'0.875rem', flexWrap:'wrap', alignItems:'center' }}>
        <Select value={month} onChange={setMonth}>
          <option value="all">All months</option>
          {allMonths.map(m => <option key={m} value={m}>{fmtMonth(m)}</option>)}
        </Select>
        <Select value={account} onChange={setAccount}>
          <option value="all">Both accounts</option>
          <option value="Canara">Canara Bank</option>
          <option value="Union">Union Bank</option>
        </Select>
        <Select value={type} onChange={setType}>
          <option value="all">All types</option>
          <option value="expense">Expenses</option>
          <option value="income">Income</option>
        </Select>
        <Select value={cat} onChange={setCat}>
          <option value="all">All categories</option>
          {allCats.map(c => <option key={c} value={c}>{c}</option>)}
        </Select>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search..."
          style={{
            border:'0.5px solid var(--border-medium)', borderRadius:8,
            padding:'6px 9px', fontSize:12, background:'var(--bg-primary)',
            color:'var(--text-primary)', fontFamily:'inherit', width:130
          }}
        />
      </div>

      <SummaryStrip expenses={fmt(totE)} income={fmt(totI)} count={filtered.length} />

      <div style={{ border:'0.5px solid var(--border-light)', borderRadius:12, overflow:'hidden' }}>
        <div style={{
          display:'grid', ...colStyle, padding:'7px 12px',
          background:'var(--bg-secondary)', fontSize:11, fontWeight:500,
          color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.4px'
        }}>
          <span>Date</span><span>Description</span><span>Category</span>
          <span style={{textAlign:'right'}}>Amount</span><span/>
        </div>

        {!filtered.length ? <EmptyState text="No transactions found" /> :
          filtered.map(t => (
            <div
              key={t.id}
              style={{
                display:'grid', ...colStyle, padding:'8px 12px',
                borderTop:'0.5px solid var(--border-light)', alignItems:'center', fontSize:13
              }}
            >
              <span style={{ color:'var(--text-secondary)', fontSize:12 }}>{t.date}</span>
              <span>
                {t.desc || '—'}
                <br/>
                <span style={{ fontSize:11, color:'var(--text-secondary)' }}>{t.account}</span>
              </span>
              <span><CatBadge name={t.cat} color={getColor(t.cat)} /></span>
              <span style={{ textAlign:'right', fontWeight:500, color: t.type==='expense' ? '#A32D2D' : '#3B6D11' }}>
                {t.type==='expense'?'-':'+'}{fmt(t.amount)}
              </span>
              <div style={{ display:'flex', gap:3, justifyContent:'flex-end' }}>
                <button onClick={() => onEdit(t)} style={{ background:'none', border:'none', cursor:'pointer', padding:'2px 5px', borderRadius:4, fontSize:13, color:'var(--text-secondary)' }}>✏</button>
                <button onClick={() => { if(window.confirm('Delete this transaction?')) onDelete(t.id) }} style={{ background:'none', border:'none', cursor:'pointer', padding:'2px 5px', borderRadius:4, fontSize:13, color:'var(--text-secondary)' }}>✕</button>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  )
}
