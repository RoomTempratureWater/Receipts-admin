'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface Tag {
  tag_id: string
  tag_name: string
  sub_tag1: string | null
  sub_tag2: string | null
  created_at: string
}

export default function ManageTags() {
  const [invoiceTags, setInvoiceTags] = useState<Tag[]>([])
  const [expenseTags, setExpenseTags] = useState<Tag[]>([])

  const [newInvoiceTag, setNewInvoiceTag] = useState('')
  const [newExpenseTag, setNewExpenseTag] = useState('')

  const [editingInvoiceTagId, setEditingInvoiceTagId] = useState<string | null>(null)
  const [editingExpenseTagId, setEditingExpenseTagId] = useState<string | null>(null)

  const [editingTagName, setEditingTagName] = useState('')

  // fetch invoice tags
  const fetchInvoiceTags = async () => {
    const { data } = await supabase.from('invoice_tags').select('*').order('created_at', { ascending: false })
    setInvoiceTags(data || [])
  }

  // fetch expense tags
  const fetchExpenseTags = async () => {
    const { data } = await supabase.from('expense_tags').select('*').order('created_at', { ascending: false })
    setExpenseTags(data || [])
  }

  useEffect(() => {
    fetchInvoiceTags()
    fetchExpenseTags()
  }, [])

  // add new invoice tag
  const handleAddInvoiceTag = async () => {
    if (!newInvoiceTag.trim()) return
    const { error } = await supabase.from('invoice_tags').insert({
      tag_name: newInvoiceTag.trim(),
      sub_tag1: null,
      sub_tag2: null,
    })
    if (!error) {
      setNewInvoiceTag('')
      fetchInvoiceTags()
    }
  }

  // add new expense tag
  const handleAddExpenseTag = async () => {
    if (!newExpenseTag.trim()) return
    const { error } = await supabase.from('expense_tags').insert({
      tag_name: newExpenseTag.trim(),
      sub_tag1: null,
      sub_tag2: null,
    })
    if (!error) {
      setNewExpenseTag('')
      fetchExpenseTags()
    }
  }

  // edit invoice tag
  const handleEditInvoice = (tagId: string, currentName: string) => {
    setEditingInvoiceTagId(tagId)
    setEditingTagName(currentName)
  }

  // save invoice tag
  const handleSaveInvoice = async (tagId: string) => {
    const { error } = await supabase
      .from('invoice_tags')
      .update({ tag_name: editingTagName })
      .eq('tag_id', tagId)
    if (!error) {
      setEditingInvoiceTagId(null)
      setEditingTagName('')
      fetchInvoiceTags()
    }
  }

  // edit expense tag
  const handleEditExpense = (tagId: string, currentName: string) => {
    setEditingExpenseTagId(tagId)
    setEditingTagName(currentName)
  }

  // save expense tag
  const handleSaveExpense = async (tagId: string) => {
    const { error } = await supabase
      .from('expense_tags')
      .update({ tag_name: editingTagName })
      .eq('tag_id', tagId)
    if (!error) {
      setEditingExpenseTagId(null)
      setEditingTagName('')
      fetchExpenseTags()
    }
  }

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Invoice Tags */}
      <Card className="p-4 space-y-4">
        <h2 className="text-xl font-semibold text-center">Invoice Tags</h2>

        <div className="flex gap-2">
          <Input
            placeholder="New invoice tag"
            value={newInvoiceTag}
            onChange={e => setNewInvoiceTag(e.target.value)}
          />
          <Button onClick={handleAddInvoiceTag}>Add</Button>
        </div>

        <div className="space-y-2">
          {invoiceTags.map(tag => (
            <div key={tag.tag_id} className="flex items-center justify-between border-b pb-2">
              {editingInvoiceTagId === tag.tag_id ? (
                <>
                  <Input
                    value={editingTagName}
                    onChange={e => setEditingTagName(e.target.value)}
                    className="flex-1 mr-2"
                  />
                  <Button size="sm" onClick={() => handleSaveInvoice(tag.tag_id)}>
                    Save
                  </Button>
                </>
              ) : (
                <>
                  <p className="flex-1">{tag.tag_name}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditInvoice(tag.tag_id, tag.tag_name)}
                  >
                    Edit
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Expense Tags */}
      <Card className="p-4 space-y-4">
        <h2 className="text-xl font-semibold text-center">Expense Tags</h2>

        <div className="flex gap-2">
          <Input
            placeholder="New expense tag"
            value={newExpenseTag}
            onChange={e => setNewExpenseTag(e.target.value)}
          />
          <Button onClick={handleAddExpenseTag}>Add</Button>
        </div>

        <div className="space-y-2">
          {expenseTags.map(tag => (
            <div key={tag.tag_id} className="flex items-center justify-between border-b pb-2">
              {editingExpenseTagId === tag.tag_id ? (
                <>
                  <Input
                    value={editingTagName}
                    onChange={e => setEditingTagName(e.target.value)}
                    className="flex-1 mr-2"
                  />
                  <Button size="sm" onClick={() => handleSaveExpense(tag.tag_id)}>
                    Save
                  </Button>
                </>
              ) : (
                <>
                  <p className="flex-1">{tag.tag_name}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditExpense(tag.tag_id, tag.tag_name)}
                  >
                    Edit
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
