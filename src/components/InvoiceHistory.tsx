'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'
import { printInvoice } from '@/lib/print_invoice'
import { Checkbox } from '@/components/ui/checkbox'

type Tag = {
  tag_id: string;
  tag_name: string;
};

type Invoice = {
  id: string;
  user_id: string;
  phone: string;
  name: string;
  title: string;
  amount: number;
  tag: string;
  payment_reference?: string;
  payment_type?: string;
  created_at: string;
  actual_amt_credit_dt: string | null;
  tags?: Tag;
};

type MonthlyTotal = {
  month: string;
  total: number;
};

function getTodayDate() {
  return new Date().toISOString().split('T')[0]
}

export default function InvoiceHistory() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [monthlyTotals, setMonthlyTotals] = useState<MonthlyTotal[]>([])
  const [totalAmount, setTotalAmount] = useState<number>(0)

  const [filterPhone, setFilterPhone] = useState('')
  const [filterTag, setFilterTag] = useState<string | undefined>()
  const [paymentRef, setPaymentRef] = useState('')
  const [paymentType, setPaymentType] = useState<string | undefined>()

  const [maxDate, setMaxDate] = useState(getTodayDate())
  const [fromDate, setFromDate] = useState('')
  const [tags, setTags] = useState<Tag[]>([])

  const [loadingDelete, setLoadingDelete] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [onlyPendingCredit, setOnlyPendingCredit] = useState(false)

  const pageSize = 50

  useEffect(() => {
    const fetchTags = async () => {
      const { data, error } = await supabase.from('tags').select('tag_id, tag_name')
      if (!error && data) setTags(data)
    }
    fetchTags()
  }, [])

  const fetchInvoices = async (
    phone = '',
    tagId?: string,
    maxDate?: string,
    pageNum = 1,
    fromDate?: string,
    paymentRef?: string,
    paymentType?: string
  ) => {
    let query = supabase
      .from('invoices')
      .select('*, tags(tag_name)')
      .order('created_at', { ascending: false })
      .range((pageNum - 1) * pageSize, pageNum * pageSize - 1)

    if (phone.trim()) query = query.eq('phone', phone.trim())
    if (tagId && tagId !== '__all__') query = query.eq('tag', tagId)
    if (paymentRef?.trim()) query = query.ilike('payment_reference', `%${paymentRef.trim()}%`)
    if (paymentType && paymentType !== '__all__') query = query.eq('payment_type', paymentType)
    if (maxDate) query = query.lte('created_at', maxDate + 'T23:59:59')
    if (fromDate) query = query.gte('created_at', fromDate + 'T00:00:00')
    if (onlyPendingCredit) query = query.is('actual_amt_credit_dt', null)

    const { data, error } = await query
    if (!error && data) {
      if (pageNum === 1) setInvoices(data)
      else setInvoices(prev => [...prev, ...data])
    }
  }

  const fetchGraphData = async (phone = '', tagId?: string, dateLimit?: string) => {
    const fromDate = new Date()
    fromDate.setMonth(fromDate.getMonth() - 11)
    fromDate.setDate(1)

    const { data } = await supabase.rpc('get_monthly_totals', {
      from_date: fromDate.toISOString(),
      max_date: dateLimit || null,
      phone_filter: phone.trim() || null,
      tag_filter: !tagId || tagId === '__all__' ? null : tagId,
    })

    if (data) setMonthlyTotals(data)
  }

  const fetchTotalAmount = async (phone = '', tagId?: string, dateLimit?: string) => {
    const { data, error } = await supabase.rpc('get_invoice_total', {
      phone_filter: phone.trim() || null,
      tag_filter: !tagId || tagId === '__all__' ? null : tagId,
      max_date: dateLimit || null,
    })

    if (!error && data !== null) setTotalAmount(data)
  }

  useEffect(() => {
    setPage(1)
    fetchInvoices(filterPhone, filterTag, maxDate, 1, fromDate, paymentRef, paymentType)
    fetchGraphData(filterPhone, filterTag, maxDate)
    fetchTotalAmount(filterPhone, filterTag, maxDate)
  }, [filterPhone, filterTag, maxDate, fromDate, paymentRef, paymentType, onlyPendingCredit])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return
    setLoadingDelete(id)
    const { error } = await supabase.from('invoices').delete().eq('id', id)
    setLoadingDelete(null)
    if (!error) {
      setInvoices(invoices => invoices.filter(inv => inv.id !== id))
      fetchGraphData(filterPhone, filterTag, maxDate)
      fetchTotalAmount(filterPhone, filterTag, maxDate)
    }
  }

  const loadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchInvoices(filterPhone, filterTag, maxDate, nextPage, fromDate, paymentRef, paymentType)
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4 justify-between">
        <h2 className="text-xl font-semibold">Invoice Dashboard</h2>

        <div>
          <label className="block text-sm font-medium mb-1">Phone Number</label>
          <Input
            placeholder="Filter by phone number"
            value={filterPhone}
            onChange={e => setFilterPhone(e.target.value)}
            className="w-64"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Payment Reference</label>
          <Input
            placeholder="Filter by payment ref"
            value={paymentRef}
            onChange={e => setPaymentRef(e.target.value)}
            className="w-64"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">From Date</label>
          <Input
            type="date"
            className="w-48"
            value={fromDate}
            max={maxDate}
            onChange={e => setFromDate(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">To Date</label>
          <Input
            type="date"
            className="w-48"
            value={maxDate}
            max={getTodayDate()}
            onChange={e => setMaxDate(e.target.value)}
          />
        </div>

        <div className="w-48">
          <label className="block text-sm font-medium mb-1">Tag</label>
          <Select value={filterTag} onValueChange={setFilterTag}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Tags</SelectItem>
              {tags
                .filter(tag => tag.tag_name.trim() !== '')
                .map(tag => (
                  <SelectItem key={tag.tag_id} value={tag.tag_id}>
                    {tag.tag_name}
                  </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-48">
          <label className="block text-sm font-medium mb-1">Payment Type</label>
          <Select value={paymentType} onValueChange={setPaymentType}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by payment type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Types</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="cheque">Cheque</SelectItem>
              <SelectItem value="upi">UPI</SelectItem>
              <SelectItem value="card">Card</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="pending-credit"
            checked={onlyPendingCredit}
            onCheckedChange={() => setOnlyPendingCredit(!onlyPendingCredit)}
          />
          <label htmlFor="pending-credit" className="text-sm">Show pending bank credits only</label>
        </div>
      </div>

      {/* Summary */}
      <div className="flex gap-6">
        <Card className="flex-1 max-w-xs">
          <CardHeader>
            <CardTitle>Total Amount</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">₹{totalAmount}</CardContent>
        </Card>

        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Monthly Totals</CardTitle>
          </CardHeader>
          <CardContent className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTotals}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <div className="overflow-auto max-h-[600px] border rounded-md">
        <table className="min-w-full border-collapse table-auto">
          <thead className="sticky top-0 bg-muted z-10">
            <tr>
              <th className="border px-3 py-2 text-left">Title</th>
              <th className="border px-3 py-2 text-left">Name</th>
              <th className="border px-3 py-2 text-left">Phone</th>
              <th className="border px-3 py-2 text-left">Tag</th>
              <th className="border px-3 py-2 text-left">Payment Type</th>
              <th className="border px-3 py-2 text-right">Amount (₹)</th>
              <th className="border px-3 py-2 text-right">Payment Reference</th>
              <th className="border px-3 py-2 text-left">Date</th>
              <th className="border px-3 py-2 text-left">Actual Credit Date</th>
              <th className="border px-3 py-2 text-center">Actions</th>
              <th className="border px-3 py-2 text-center">Record Create date</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center p-4">No invoices found.</td>
              </tr>
            ) : (
              invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="border px-3 py-2">{inv.title}</td>
                  <td className="border px-3 py-2">{inv.name}</td>
                  <td className="border px-3 py-2">{inv.phone}</td>
                  <td className="border px-3 py-2">{inv.tags?.tag_name || <span className="italic text-gray-400">None</span>}</td>
                  <td className="border px-3 py-2">{inv.payment_type || <span className="italic text-gray-400">—</span>}</td>
                  <td className="border px-3 py-2 text-right">{inv.amount}</td>
                  <td className="border px-3 py-2">{inv.payment_reference || <span className="italic text-gray-400">—</span>}</td>  
                  <td className="border px-3 py-2">{new Date(inv.created_at).toLocaleDateString()}</td>
                  <td className="border px-3 py-2">
                    <input
                      type="date"
                      className="border px-2 py-1 rounded text-sm dark:bg-gray-800"
                      value={inv.actual_amt_credit_dt?.slice(0, 10) || ''}
                      onChange={async (e) => {
                        const newDate = e.target.value
                        const { error } = await supabase
                          .from('invoices')
                          .update({ actual_amt_credit_dt: newDate || null })
                          .eq('id', inv.id)
                        if (!error) {
                          setInvoices((prev) =>
                            prev.map((row) =>
                              row.id === inv.id ? { ...row, actual_amt_credit_dt: newDate || null } : row
                            )
                          )
                        } else {
                          alert('Failed to update date')
                        }
                      }}
                    />
                  </td>
                  <td className="border px-3 py-2 text-center space-x-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(inv.id)}
                      disabled={loadingDelete === inv.id}
                    >
                      {loadingDelete === inv.id ? 'Deleting...' : 'Delete'}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => printInvoice(inv)}
                    >
                      Print
                    </Button>
                  </td>
                  <td className="border px-3 py-2">{new Date(inv.created_at).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {invoices.length >= page * pageSize && (
        <div className="text-center">
          <Button onClick={loadMore} variant="outline">Load More</Button>
        </div>
      )}
    </div>
  )
}
