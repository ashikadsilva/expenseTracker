import React, { useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { Btn } from './UI.jsx'

export default function ImportTab({ onImport, ensureCategory }) {
  const fileRef = useRef()
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setLoading(true)
    setResult(null)

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type:'array', cellDates:true })
        const rows = []

        wb.SheetNames.forEach(sheetName => {
          if (!sheetName.toLowerCase().includes('transaction')) return
          const isCanara = sheetName.toLowerCase().includes('canara')
          const account = isCanara ? 'Canara' : 'Union'
          const ws = wb.Sheets[sheetName]
          const rawRows = XLSX.utils.sheet_to_json(ws, { header:1, defval:null })

          rawRows.forEach((row, i) => {
            if (i < 4) return

            const tryRow = (dateVal, amtVal, descVal, catVal, type) => {
              if (!dateVal || !amtVal || isNaN(parseFloat(amtVal))) return
              let dateStr = ''
              if (dateVal instanceof Date) {
                const y = dateVal.getFullYear()
                const m = String(dateVal.getMonth()+1).padStart(2,'0')
                const d = String(dateVal.getDate()).padStart(2,'0')
                if (y < 2020 || y > 2030) return
                dateStr = `${y}-${m}-${d}`
              } else if (typeof dateVal === 'string' && dateVal.includes('-')) {
                dateStr = dateVal.split(' ')[0]
              } else return

              const amount = Math.round(parseFloat(amtVal) * 100) / 100
              const cat = String(catVal || 'Other').trim() || 'Other'
              const desc = String(descVal || '').trim()
              ensureCategory(cat, type)
              rows.push({ date:dateStr, amount, desc, cat, account, type })
            }

            // Expense cols B(1) C(2) D(3) E(4)
            tryRow(row[1], row[2], row[3], row[4], 'expense')
            // Income cols G(6) H(7) I(8) J(9)
            tryRow(row[6], row[7], row[8], row[9], 'income')
          })
        })

        const added = onImport(rows)
        setResult({ ok:true, added, skipped: rows.length - added, file: file.name })
      } catch (err) {
        setResult({ ok:false, error: err.message })
      }
      setLoading(false)
      e.target.value = ''
    }
    reader.readAsArrayBuffer(file)
  }

  return (
    <div>
      <div
        onClick={() => fileRef.current.click()}
        style={{
          border:'1.5px dashed var(--border-medium)', borderRadius:12,
          padding:'2.5rem', textAlign:'center', cursor:'pointer',
          marginBottom:'1rem', transition:'background 0.15s'
        }}
        onMouseEnter={e => e.currentTarget.style.background='var(--bg-secondary)'}
        onMouseLeave={e => e.currentTarget.style.background='transparent'}
      >
        <div style={{ fontSize:32, marginBottom:'0.5rem' }}>📂</div>
        <div style={{ fontSize:14, fontWeight:500, color:'var(--text-primary)', marginBottom:4 }}>
          Upload your Monthly_budget.xlsx
        </div>
        <div style={{ fontSize:12, color:'var(--text-secondary)', marginBottom:'0.875rem' }}>
          Reads all Transactions sheets. Detects Canara and Union accounts automatically.
        </div>
        <Btn variant="primary" onClick={e => { e.stopPropagation(); fileRef.current.click() }}>
          {loading ? 'Reading...' : 'Choose file'}
        </Btn>
      </div>

      <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display:'none' }} onChange={handleFile} />

      {result && (
        <div style={{
          padding:'0.875rem', borderRadius:8, marginBottom:'1rem',
          background: result.ok ? '#EAF3DE' : '#FCEBEB',
          color: result.ok ? '#3B6D11' : '#A32D2D',
          fontSize:13
        }}>
          {result.ok
            ? `✓ Imported ${result.added} new transactions, skipped ${result.skipped} duplicates from "${result.file}".`
            : `Error: ${result.error}`
          }
        </div>
      )}

      <div style={{
        padding:'0.875rem', background:'var(--bg-secondary)',
        borderRadius:8, fontSize:12, color:'var(--text-secondary)', lineHeight:1.8
      }}>
        <div style={{ fontWeight:500, marginBottom:'0.375rem', color:'var(--text-primary)' }}>How import works</div>
        <div>• Sheets with "Transactions" in the name are read</div>
        <div>• Account detected from sheet name: "Canara" → Canara Bank, others → Union Bank</div>
        <div>• Expense columns: B (Date), C (Amount), D (Description), E (Category)</div>
        <div>• Income columns: G (Date), H (Amount), I (Description), J (Category)</div>
        <div>• Duplicate entries (same date + amount + account) are skipped automatically</div>
        <div>• New categories found in the file are added automatically</div>
      </div>
    </div>
  )
}
