'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Card } from '@/components/ui/card'

interface Tag {
  tag_id: string
  tag_name: string
}

interface Record {
  tag: string
  payment_type: string
  amount: number
}

export default function BalanceSheet() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [tags, setTags] = useState<Tag[]>([])
  const [invoiceRecords, setInvoiceRecords] = useState<Record[]>([])
  const [expenseRecords, setExpenseRecords] = useState<Record[]>([])
  const [invoiceTags, setInvoiceTags] = useState<string[]>([])
  const [expenseTags, setExpenseTags] = useState<string[]>([])

  useEffect(() => {
    const loadTags = async () => {
      const { data } = await supabase.from('tags').select('tag_id, tag_name')
      if (data) {
        setTags(data)
        setInvoiceTags(data.map(t => t.tag_id))
        setExpenseTags(data.map(t => t.tag_id))
      }
    }
    loadTags()
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      if (!startDate || !endDate) return

      const invoiceQuery = supabase
        .from('invoices')
        .select('tag, payment_type, amount')
        .gte('date', startDate)
        .lte('date', endDate)

      const expenseQuery = supabase
        .from('expenditures')
        .select('tag, payment_type, amount')
        .gte('date', startDate)
        .lte('date', endDate)

      const [invoiceRes, expenseRes] = await Promise.all([invoiceQuery, expenseQuery])

      if (invoiceRes.data) setInvoiceRecords(invoiceRes.data)
      if (expenseRes.data) setExpenseRecords(expenseRes.data)
    }

    fetchData()
  }, [startDate, endDate])

  const groupByTagAndType = (data: Record[], selectedTags: string[]) => {
    const totals: Record<string, { cash: number; bank: number }> = {}

    for (const entry of data) {
      if (!selectedTags.includes(entry.tag)) continue
      if (!totals[entry.tag]) totals[entry.tag] = { cash: 0, bank: 0 }

      const isCash = entry.payment_type === 'cash'
      if (isCash) totals[entry.tag].cash += entry.amount
      else totals[entry.tag].bank += entry.amount
    }

    return totals
  }

  const invoiceTotals = groupByTagAndType(invoiceRecords, invoiceTags)
  const expenseTotals = groupByTagAndType(expenseRecords, expenseTags)

  const totalInvoiceCash = Object.values(invoiceTotals).reduce((sum, t) => sum + t.cash, 0)
  const totalInvoiceBank = Object.values(invoiceTotals).reduce((sum, t) => sum + t.bank, 0)
  const totalExpenseCash = Object.values(expenseTotals).reduce((sum, t) => sum + t.cash, 0)
  const totalExpenseBank = Object.values(expenseTotals).reduce((sum, t) => sum + t.bank, 0)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h2 className="text-2xl font-semibold text-center">Balance Sheet</h2>

      <div className="flex gap-4 flex-wrap items-end">
        <div>
          <Label>Start Date</Label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div>
          <Label>End Date</Label>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Invoice Side */}
        <Card className="flex-1 p-4">
          <h3 className="font-semibold mb-2">Invoices</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="mb-2">
                Invoice Tags ({invoiceTags.length})
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="p-2 max-h-64 overflow-auto space-y-2">
              {tags.map(tag => (
                <div key={tag.tag_id} className="flex items-center gap-2 px-2">
                  <Checkbox
                    checked={invoiceTags.includes(tag.tag_id)}
                    onCheckedChange={() => {
                      setInvoiceTags(prev =>
                        prev.includes(tag.tag_id)
                          ? prev.filter(t => t !== tag.tag_id)
                          : [...prev, tag.tag_id]
                      )
                    }}
                  />
                  <span className="text-sm">{tag.tag_name}</span>
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <table className="w-full mt-2 text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-1">Tag</th>
                <th className="text-right py-1">Cash</th>
                <th className="text-right py-1">Bank</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(invoiceTotals).map(([tagId, { cash, bank }]) => {
                const tagName = tags.find(t => t.tag_id === tagId)?.tag_name || tagId
                return (
                  <tr key={tagId}>
                    <td>{tagName}</td>
                    <td className="text-right">₹{cash}</td>
                    <td className="text-right">₹{bank}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>

        {/* Expenditure Side */}
        <Card className="flex-1 p-4">
          <h3 className="font-semibold mb-2">Expenditures</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="mb-2">
                Expense Tags ({expenseTags.length})
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="p-2 max-h-64 overflow-auto space-y-2">
              {tags.map(tag => (
                <div key={tag.tag_id} className="flex items-center gap-2 px-2">
                  <Checkbox
                    checked={expenseTags.includes(tag.tag_id)}
                    onCheckedChange={() => {
                      setExpenseTags(prev =>
                        prev.includes(tag.tag_id)
                          ? prev.filter(t => t !== tag.tag_id)
                          : [...prev, tag.tag_id]
                      )
                    }}
                  />
                  <span className="text-sm">{tag.tag_name}</span>
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <table className="w-full mt-2 text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-1">Tag</th>
                <th className="text-right py-1">Cash</th>
                <th className="text-right py-1">Bank</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(expenseTotals).map(([tagId, { cash, bank }]) => {
                const tagName = tags.find(t => t.tag_id === tagId)?.tag_name || tagId
                return (
                  <tr key={tagId}>
                    <td>{tagName}</td>
                    <td className="text-right">₹{cash}</td>
                    <td className="text-right">₹{bank}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      </div>

      <div className="flex justify-between max-w-xl mx-auto border-t pt-4 mt-6 text-lg font-semibold">
        <div>Net Cash: ₹{totalInvoiceCash - totalExpenseCash}</div>
        <div>Net Bank: ₹{totalInvoiceBank - totalExpenseBank}</div>
      </div>
    </div>
  )
}

