import React from 'react'
import { PALETTE } from '../constants.js'

const s = {
  btn: {
    display:'inline-flex', alignItems:'center', gap:6,
    border:'none', borderRadius:8, padding:'7px 14px',
    fontSize:12, fontWeight:500, cursor:'pointer', fontFamily:'inherit'
  }
}

export function Btn({ variant='primary', children, onClick, style={}, disabled }) {
  const variants = {
    primary: { background:'#185FA5', color:'#fff' },
    secondary: { background:'var(--bg-secondary)', color:'var(--text-primary)', border:'0.5px solid var(--border-medium)' },
    danger: { background:'#FCEBEB', color:'#A32D2D', border:'0.5px solid #F09595' },
    success: { background:'#EAF3DE', color:'#3B6D11', border:'0.5px solid #97C459' },
    ghost: { background:'transparent', color:'var(--text-secondary)', border:'none', padding:'4px 6px' },
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ ...s.btn, ...variants[variant], opacity: disabled ? 0.5 : 1, ...style }}
    >
      {children}
    </button>
  )
}

export function Select({ id, value, onChange, children, style={} }) {
  return (
    <select
      id={id}
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        background:'var(--bg-primary)', border:'0.5px solid var(--border-medium)',
        borderRadius:8, padding:'6px 10px', fontSize:12,
        color:'var(--text-primary)', cursor:'pointer', fontFamily:'inherit', ...style
      }}
    >
      {children}
    </select>
  )
}

export function Input({ id, type='text', value, onChange, placeholder, min, style={} }) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      min={min}
      style={{
        width:'100%', background:'var(--bg-primary)',
        border:'0.5px solid var(--border-medium)', borderRadius:8,
        padding:'8px 10px', fontSize:13, color:'var(--text-primary)',
        fontFamily:'inherit', ...style
      }}
    />
  )
}

export function FormRow({ label, children }) {
  return (
    <div style={{ marginBottom:10 }}>
      <label style={{ display:'block', fontSize:12, color:'var(--text-secondary)', marginBottom:3 }}>{label}</label>
      {children}
    </div>
  )
}

export function Modal({ open, onClose, title, children, width=360 }) {
  if (!open) return null
  return (
    <div
      onClick={onClose}
      style={{
        position:'fixed', inset:0, background:'rgba(0,0,0,0.4)',
        zIndex:200, display:'flex', alignItems:'flex-start',
        justifyContent:'center', paddingTop:'5vh', overflowY:'auto'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background:'var(--bg-primary)', border:'0.5px solid var(--border-medium)',
          borderRadius:12, padding:'1.25rem', width, maxWidth:'92vw',
          marginBottom:'5vh'
        }}
      >
        <div style={{ fontSize:15, fontWeight:500, marginBottom:'1rem', color:'var(--text-primary)' }}>{title}</div>
        {children}
      </div>
    </div>
  )
}

export function ModalActions({ children }) {
  return <div style={{ display:'flex', gap:6, marginTop:'1rem', justifyContent:'flex-end' }}>{children}</div>
}

export function CatBadge({ name, color }) {
  return (
    <span style={{
      display:'inline-block', padding:'2px 8px', borderRadius:10,
      fontSize:11, fontWeight:500, background: color+'22', color
    }}>
      {name}
    </span>
  )
}

export function MetricCard({ label, value, color }) {
  return (
    <div style={{
      background:'var(--bg-secondary)', borderRadius:8, padding:'0.75rem'
    }}>
      <div style={{ fontSize:11, color:'var(--text-secondary)', marginBottom:3 }}>{label}</div>
      <div style={{ fontSize:18, fontWeight:500, color: color||'var(--text-primary)' }}>{value}</div>
    </div>
  )
}

export function ColorPicker({ selected, onSelect }) {
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:4 }}>
      {PALETTE.map(c => (
        <div
          key={c}
          onClick={() => onSelect(c)}
          style={{
            width:20, height:20, borderRadius:'50%', cursor:'pointer',
            background:c, border: c===selected ? '2px solid var(--text-primary)' : '2px solid transparent',
            flexShrink:0
          }}
        />
      ))}
    </div>
  )
}

export function TypeToggle({ value, onChange }) {
  return (
    <div style={{ display:'flex', gap:5, marginBottom:10 }}>
      {['expense','income'].map(t => (
        <button
          key={t}
          onClick={() => onChange(t)}
          style={{
            flex:1, padding:'6px', borderRadius:8, fontSize:12, cursor:'pointer',
            fontFamily:'inherit', fontWeight:500,
            border: '0.5px solid',
            background: value===t ? (t==='expense' ? '#FCEBEB' : '#EAF3DE') : 'transparent',
            borderColor: value===t ? (t==='expense' ? '#E24B4A' : '#97C459') : 'var(--border-medium)',
            color: value===t ? (t==='expense' ? '#A32D2D' : '#3B6D11') : 'var(--text-secondary)'
          }}
        >
          {t.charAt(0).toUpperCase()+t.slice(1)}
        </button>
      ))}
    </div>
  )
}

export function EmptyState({ text='No data found' }) {
  return (
    <div style={{ textAlign:'center', padding:'2rem', color:'var(--text-secondary)', fontSize:13 }}>
      {text}
    </div>
  )
}

export function SummaryStrip({ expenses, income, count }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:'0.875rem' }}>
      <div style={{ background:'var(--bg-secondary)', borderRadius:8, padding:'8px 10px' }}>
        <div style={{ fontSize:11, color:'var(--text-secondary)' }}>Expenses</div>
        <div style={{ fontSize:14, fontWeight:500, color:'#A32D2D' }}>{expenses}</div>
      </div>
      <div style={{ background:'var(--bg-secondary)', borderRadius:8, padding:'8px 10px' }}>
        <div style={{ fontSize:11, color:'var(--text-secondary)' }}>Income</div>
        <div style={{ fontSize:14, fontWeight:500, color:'#3B6D11' }}>{income}</div>
      </div>
      <div style={{ background:'var(--bg-secondary)', borderRadius:8, padding:'8px 10px' }}>
        <div style={{ fontSize:11, color:'var(--text-secondary)' }}>Count</div>
        <div style={{ fontSize:14, fontWeight:500 }}>{count}</div>
      </div>
    </div>
  )
}
