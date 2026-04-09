import React, { useState, useEffect } from 'react'
import { Modal, FormRow, Input, Select, ModalActions, Btn, ColorPicker } from './UI.jsx'
import { PALETTE } from '../constants.js'

export default function CategoryModal({ open, onClose, onSave, category }) {
  const [name, setName] = useState('')
  const [type, setType] = useState('expense')
  const [color, setColor] = useState(PALETTE[0])

  useEffect(() => {
    if (open) {
      if (category) {
        setName(category.name)
        setType(category.type)
        setColor(category.color)
      } else {
        setName('')
        setType('expense')
        setColor(PALETTE[0])
      }
    }
  }, [open, category])

  const handleSave = () => {
    if (!name.trim()) { alert('Enter a category name.'); return }
    onSave({ name: name.trim(), type, color })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={category ? 'Edit category' : 'New category'}>
      <FormRow label="Category name">
        <Input value={name} onChange={setName} placeholder="e.g. Gym, Petrol" />
      </FormRow>
      <FormRow label="Type">
        <Select value={type} onChange={setType}>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </Select>
      </FormRow>
      <FormRow label="Color">
        <ColorPicker selected={color} onSelect={setColor} />
      </FormRow>
      <ModalActions>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={handleSave}>Save</Btn>
      </ModalActions>
    </Modal>
  )
}
