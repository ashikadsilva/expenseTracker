import { useState, useEffect, useCallback } from 'react'
import { DEFAULT_CATEGORIES, SEED_TRANSACTIONS, PALETTE } from './constants.js'

function load(key, fallback) {
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : fallback
  } catch { return fallback }
}

function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

export function useStore() {
  const [transactions, setTransactionsRaw] = useState(() =>
    load('et_transactions', SEED_TRANSACTIONS)
  )
  const [categories, setCategoriesRaw] = useState(() =>
    load('et_categories', DEFAULT_CATEGORIES)
  )

  const setTransactions = useCallback((val) => {
    const next = typeof val === 'function' ? val(transactions) : val
    setTransactionsRaw(next)
    save('et_transactions', next)
  }, [transactions])

  const setCategories = useCallback((val) => {
    const next = typeof val === 'function' ? val(categories) : val
    setCategoriesRaw(next)
    save('et_categories', next)
  }, [categories])

  const nextId = useCallback(() =>
    Math.max(0, ...transactions.map(t => t.id)) + 1
  , [transactions])

  const addTransaction = useCallback((txn) => {
    setTransactions(prev => [...prev, { ...txn, id: nextId() }])
  }, [setTransactions, nextId])

  const updateTransaction = useCallback((id, txn) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...txn } : t))
  }, [setTransactions])

  const deleteTransaction = useCallback((id) => {
    setTransactions(prev => prev.filter(t => t.id !== id))
  }, [setTransactions])

  const getColor = useCallback((catName) => {
    const all = [...categories.expense, ...categories.income]
    return all.find(c => c.name === catName)?.color ?? '#888780'
  }, [categories])

  const addCategory = useCallback((name, type, color) => {
    setCategoriesRaw(prev => {
      const next = { ...prev, [type]: [...prev[type], { name, color }] }
      save('et_categories', next)
      return next
    })
  }, [])

  const updateCategory = useCallback((oldName, oldType, newName, newType, color) => {
    setCategoriesRaw(prev => {
      let exp = [...prev.expense]
      let inc = [...prev.income]
      if (oldType === 'expense') exp = exp.filter(c => c.name !== oldName)
      else inc = inc.filter(c => c.name !== oldName)
      if (newType === 'expense') exp = [...exp, { name: newName, color }]
      else inc = [...inc, { name: newName, color }]
      const next = { expense: exp, income: inc }
      save('et_categories', next)
      return next
    })
    if (oldName !== newName) {
      setTransactions(prev => prev.map(t => t.cat === oldName ? { ...t, cat: newName } : t))
    }
  }, [setTransactions])

  const deleteCategory = useCallback((name, type) => {
    setCategoriesRaw(prev => {
      const next = { ...prev, [type]: prev[type].filter(c => c.name !== name) }
      save('et_categories', next)
      return next
    })
  }, [])

  const importTransactions = useCallback((rows) => {
    setTransactions(prev => {
      const existingKeys = new Set(prev.map(t => `${t.date}_${t.amount}_${t.account}_${t.type}`))
      let nid = Math.max(0, ...prev.map(t => t.id))
      const toAdd = []
      rows.forEach(r => {
        const key = `${r.date}_${r.amount}_${r.account}_${r.type}`
        if (!existingKeys.has(key)) {
          existingKeys.add(key)
          toAdd.push({ ...r, id: ++nid })
        }
      })
      return [...prev, ...toAdd]
    })
    return rows.length
  }, [setTransactions])

  const ensureCategory = useCallback((name, type) => {
    setCategoriesRaw(prev => {
      const list = prev[type]
      if (list.some(c => c.name === name)) return prev
      const color = PALETTE[list.length % PALETTE.length]
      const next = { ...prev, [type]: [...list, { name, color }] }
      save('et_categories', next)
      return next
    })
  }, [])

  return {
    transactions, categories,
    addTransaction, updateTransaction, deleteTransaction,
    getColor, addCategory, updateCategory, deleteCategory,
    importTransactions, ensureCategory
  }
}
