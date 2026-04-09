import React, { useMemo } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts'
import { MetricCard, EmptyState } from './UI.jsx'
import { fmt, fmtMonth } from '../constants.js'

const MONTHS = ['2025-08','2025-09','2025-10','2025-11','2025-12','2026-01','2026-02']

export default function Dashboard({ transactions, getColor, filterMonth, filterAccount }) {
  const filtered = useMemo(() => transactions.filter(t => {
    if (filterMonth !== 'all' && !t.date.startsWith(filterMonth)) return false
    if (filterAccount !== 'all' && t.account !== filterAccount) return false
    return true
  }), [transactions, filterMonth, filterAccount])

  const expenses = filtered.filter(t => t.type === 'expense')
  const income = filtered.filter(t => t.type === 'income')
  const totE = expenses.reduce((s,t)=>s+t.amount,0)
  const totI = income.reduce((s,t)=>s+t.amount,0)
  const net = totI - totE

  const catMap = {}
  expenses.forEach(t => { catMap[t.cat] = (catMap[t.cat]||0) + t.amount })
  const catData = Object.entries(catMap).sort((a,b)=>b[1]-a[1])

  const trendData = MONTHS.map(mo => ({
    name: fmtMonth(mo).split(' ')[0],
    Expenses: Math.round(transactions.filter(t=>t.type==='expense'&&t.date.startsWith(mo)&&(filterAccount==='all'||t.account===filterAccount)).reduce((s,t)=>s+t.amount,0)),
    Income: Math.round(transactions.filter(t=>t.type==='income'&&t.date.startsWith(mo)&&(filterAccount==='all'||t.account===filterAccount)).reduce((s,t)=>s+t.amount,0))
  }))

  const fmtK = v => v >= 1000 ? (v/1000).toFixed(0)+'k' : v

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:'1rem' }}>
        <MetricCard label="Total expenses" value={fmt(totE)} color="#A32D2D" />
        <MetricCard label="Total income" value={fmt(totI)} color="#3B6D11" />
        <MetricCard label="Net" value={fmt(net)} color={net>=0?'#3B6D11':'#A32D2D'} />
        <MetricCard label="Transactions" value={filtered.length} color="#185FA5" />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:'1rem' }}>
        <div style={{ background:'var(--bg-primary)', border:'0.5px solid var(--border-light)', borderRadius:12, padding:'0.875rem' }}>
          <div style={{ fontSize:12, fontWeight:500, color:'var(--text-secondary)', marginBottom:8 }}>Expenses by category</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:6 }}>
            {catData.slice(0,8).map(([cat]) => (
              <span key={cat} style={{ fontSize:11, color:'var(--text-secondary)', display:'flex', alignItems:'center', gap:3 }}>
                <span style={{ width:8, height:8, borderRadius:2, background:getColor(cat), display:'inline-block' }}/>
                {cat}
              </span>
            ))}
          </div>
          {catData.length ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={catData.map(([name,value])=>({name,value}))} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={80}>
                  {catData.map(([name]) => <Cell key={name} fill={getColor(name)} />)}
                </Pie>
                <Tooltip formatter={(v)=>fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyState text="No expense data" />}
        </div>

        <div style={{ background:'var(--bg-primary)', border:'0.5px solid var(--border-light)', borderRadius:12, padding:'0.875rem' }}>
          <div style={{ fontSize:12, fontWeight:500, color:'var(--text-secondary)', marginBottom:8 }}>Monthly trend</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData} margin={{ top:4, right:8, left:0, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
              <XAxis dataKey="name" tick={{ fontSize:11 }} />
              <YAxis tickFormatter={fmtK} tick={{ fontSize:11 }} width={36} />
              <Tooltip formatter={(v)=>fmt(v)} />
              <Line type="monotone" dataKey="Expenses" stroke="#E24B4A" strokeWidth={2} dot={{ r:3 }} />
              <Line type="monotone" dataKey="Income" stroke="#639922" strokeWidth={2} dot={{ r:3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background:'var(--bg-primary)', border:'0.5px solid var(--border-light)', borderRadius:12, padding:'0.875rem' }}>
        <div style={{ fontSize:12, fontWeight:500, color:'var(--text-secondary)', marginBottom:'0.75rem' }}>Top spending categories</div>
        {catData.length ? catData.slice(0,8).map(([cat, amt]) => {
          const pct = totE > 0 ? Math.round(amt/totE*100) : 0
          const col = getColor(cat)
          return (
            <div key={cat} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:7 }}>
              <span style={{ fontSize:13, flex:'0 0 120px', color:'var(--text-primary)' }}>{cat}</span>
              <div style={{ flex:2, height:5, background:'var(--bg-secondary)', borderRadius:3, overflow:'hidden' }}>
                <div style={{ width:`${pct}%`, height:'100%', background:col, borderRadius:3 }}/>
              </div>
              <span style={{ fontSize:11, color:'var(--text-secondary)', minWidth:28, textAlign:'right' }}>{pct}%</span>
              <span style={{ fontSize:13, fontWeight:500, minWidth:72, textAlign:'right' }}>{fmt(amt)}</span>
            </div>
          )
        }) : <EmptyState />}
      </div>
    </div>
  )
}
