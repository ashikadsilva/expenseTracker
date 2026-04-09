import React from 'react'
import { Btn } from './UI.jsx'

export default function ManageCategories({ categories, onAdd, onEdit, onDelete }) {
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.875rem' }}>
        <span style={{ fontSize:13, color:'var(--text-secondary)' }}>
          Manage your expense and income categories
        </span>
        <Btn variant="primary" onClick={onAdd}>+ New category</Btn>
      </div>

      {['expense','income'].map(type => (
        <div key={type} style={{ marginBottom:'1.25rem' }}>
          <div style={{
            fontSize:11, fontWeight:500, color:'var(--text-secondary)',
            textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'0.5rem'
          }}>
            {type} categories
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:8 }}>
            {categories[type].map(c => (
              <div
                key={c.name}
                style={{
                  background:'var(--bg-primary)', border:'0.5px solid var(--border-light)',
                  borderRadius:8, padding:'0.75rem',
                  display:'flex', alignItems:'center', gap:8
                }}
              >
                <div style={{ width:10, height:10, borderRadius:'50%', background:c.color, flexShrink:0 }}/>
                <span style={{ fontSize:13, flex:1, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {c.name}
                </span>
                <button
                  onClick={() => onEdit({ ...c, type })}
                  style={{ background:'none', border:'none', cursor:'pointer', padding:'2px 4px', borderRadius:4, fontSize:13, color:'var(--text-secondary)' }}
                >✏</button>
                <button
                  onClick={() => {
                    if (window.confirm(`Delete "${c.name}"? Transactions will keep this category name.`))
                      onDelete(c.name, type)
                  }}
                  style={{ background:'none', border:'none', cursor:'pointer', padding:'2px 4px', borderRadius:4, fontSize:13, color:'var(--text-secondary)' }}
                >✕</button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
