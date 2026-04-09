import React, { useMemo, useState } from 'react'
import { Select, EmptyState } from './UI.jsx'
import { fmt, fmtMonth } from '../constants.js'

export default function CategoriesView({ transactions, getColor, allMonths }) {
  const [month, setMonth] = useState('all')
  const [account, setAccount] = useState('all')

  const filtered = useMemo(() => transactions.filter(t => {
    if (t.type !== 'expense') return false
    if (month !== 'all' && !t.date.startsWith(month)) return false
    if (account !== 'all' && t.account !== account) return false
    return true
  }), [transactions, month, account])

  const catMap = {}
  filtered.forEach(t => { catMap[t.cat] = (catMap[t.cat]||0) + t.amount })
  const cats = Object.entries(catMap).sort((a,b) => b[1]-a[1])
  const total = cats.reduce((s,c) => s+c[1], 0)

  return (
    <div>
      <div style={{ display:'flex', gap:6, marginBottom:'0.875rem', flexWrap:'wrap' }}>
        <Select value={month} onChange={setMonth}>
          <option value="all">All months</option>
          {allMonths.map(m => <option key={m} value={m}>{fmtMonth(m)}</option>)}
        </Select>
        <Select value={account} onChange={setAccount}>
          <option value="all">Both accounts</option>
          <option value="Canara">Canara Bank</option>
          <option value="Union">Union Bank</option>
        </Select>
      </div>

      {!cats.length ? <EmptyState text="No expense data for this period" /> : (
        <div style={{ border:'0.5px solid var(--border-light)', borderRadius:12, overflow:'hidden' }}>
          <div style={{
            display:'grid', gridTemplateColumns:'130px 1fr 100px 72px',
            padding:'7px 12px', background:'var(--bg-secondary)',
            fontSize:11, fontWeight:500, color:'var(--text-secondary)',
            textTransform:'uppercase', letterSpacing:'0.4px'
          }}>
            <span>Category</span><span>Share</span>
            <span style={{textAlign:'right'}}>Amount</span>
            <span style={{textAlign:'right'}}>%</span>
          </div>

          {cats.map(([cat, amt]) => {
            const pct = total > 0 ? (amt/total*100).toFixed(1) : 0
            const col = getColor(cat)
            return (
              <div
                key={cat}
                style={{
                  display:'grid', gridTemplateColumns:'130px 1fr 100px 72px',
                  padding:'9px 12px', borderTop:'0.5px solid var(--border-light)',
                  alignItems:'center', fontSize:13
                }}
              >
                <span style={{ fontWeight:500, display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ width:8, height:8, borderRadius:50, background:col, flexShrink:0, display:'inline-block' }}/>
                  {cat}
                </span>
                <div style={{ paddingRight:12 }}>
                  <div style={{ height:5, background:'var(--bg-secondary)', borderRadius:3, overflow:'hidden' }}>
                    <div style={{ width:`${pct}%`, height:'100%', background:col, borderRadius:3 }}/>
                  </div>
                </div>
                <span style={{ textAlign:'right', fontWeight:500, color:'#A32D2D' }}>{fmt(amt)}</span>
                <span style={{ textAlign:'right', color:'var(--text-secondary)' }}>{pct}%</span>
              </div>
            )
          })}

          <div style={{
            display:'grid', gridTemplateColumns:'130px 1fr 100px 72px',
            padding:'9px 12px', borderTop:'1px solid var(--border-medium)',
            fontSize:13, fontWeight:500
          }}>
            <span>Total</span><span/><span style={{ textAlign:'right', color:'#A32D2D' }}>{fmt(total)}</span><span/>
          </div>
        </div>
      )}
    </div>
  )
}
