import React, { useState, useEffect } from 'react'
import { Modal, FormRow, Input, Select, ModalActions, Btn, TypeToggle } from './UI.jsx'
import { today } from '../constants.js'

export default function TransactionModal({ open, onClose, onSave, transaction, categories }) {
  const [type, setType] = useState('expense')
  const [date, setDate] = useState(today())
  const [amount, setAmount] = useState('')
  const [desc, setDesc] = useState('')
  const [cat, setCat] = useState('')
  const [account, setAccount] = useState('Canara')

  useEffect(() => {
    if (open) {
      if (transaction) {
        setType(transaction.type)
        setDate(transaction.date)
        setAmount(String(transaction.amount))
        setDesc(transaction.desc || '')
        setCat(transaction.cat)
        setAccount(transaction.account)
      } else {
        setType('expense')
        setDate(today())
        setAmount('')
        setDesc('')
        setAccount('Canara')
      }
    }
  }, [open, transaction])

  useEffect(() => {
    const cats = categories[type]
    if (cats.length) {
      if (!cats.find(c => c.name === cat)) setCat(cats[0].name)
    }
  }, [type, categories, cat])

  const handleSave = () => {
    if (!date || !amount || isNaN(parseFloat(amount))) {
      alert('Please fill in date and amount.')
      return
    }
    onSave({ type, date, amount: parseFloat(amount), desc, cat, account })
    onClose()
  }

  const cats = categories[type] || []

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={transaction ? 'Edit transaction' : 'Add transaction'}
    >
      <TypeToggle value={type} onChange={setType} />
      <FormRow label="Date">
        <Input type="date" value={date} onChange={setDate} />
      </FormRow>
      <FormRow label="Amount (₹)">
        <Input type="number" value={amount} onChange={setAmount} placeholder="0" min="0" />
      </FormRow>
      <FormRow label="Description">
        <Input value={desc} onChange={setDesc} placeholder="e.g. Zomato order" />
      </FormRow>
      <FormRow label="Category">
        <Select value={cat} onChange={setCat}>
          {cats.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
        </Select>
      </FormRow>
      <FormRow label="Account">
        <Select value={account} onChange={setAccount}>
          <option value="Canara">Canara Bank</option>
          <option value="Union">Union Bank</option>
        </Select>
      </FormRow>
      <ModalActions>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={handleSave}>Save</Btn>
      </ModalActions>
    </Modal>
  )
}
