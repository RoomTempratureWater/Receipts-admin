'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

type Attribution = {
  invoice_id: string
  phone: string
  name: string
  effective_month: string
  amount: number
}

type MonthlyTotal = {
  month: string
  total: number
}

function getTodayDate() {
  return new Date().toISOString().split('T')[0]
}

export default function InvoiceAttributionHistory() {
  const [attributions, setAttributions] = useState<Attribution[]>([])
  const [filterPhone, setFilterPhone] = useState('')
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 11)
    return d.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(getTodayDate())

  const fetchAttributions = async () => {
    if (!filterPhone.trim()) return

    const { data, error } = await supabase
      .from('invoice_attributions')
      .select('*')
      .eq('phone', filterPhone.trim())

    if (!error && data) {
      const from = new Date(startDate)
      const to = new Date(endDate)

      const filtered = data.filter(row => {
        const rowDate = new Date(row.effective_month)
        return rowDate >= from && rowDate <= to
      })

      setAttributions(filtered)
    } else {
      console.error('Fetch error:', error)
    }
  }

  const getMonthlyTotals = (): MonthlyTotal[] => {
    const map = new Map<string, number>()
  
    for (const attr of attributions) {
      const date = new Date(attr.effective_month)
      const monthStr = date.toLocaleString('default', { month: 'long', year: 'numeric' }) // e.g. "May 2024"
      map.set(monthStr, (map.get(monthStr) || 0) + attr.amount)
    }
  
    return Array.from(map.entries())
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
  }

  const totalAmount = attributions.reduce((sum, a) => sum + a.amount, 0)
  const monthlyTotals = getMonthlyTotals()

  useEffect(() => {
    fetchAttributions()
  }, [filterPhone, startDate, endDate])

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4 justify-between">
        <h2 className="text-xl font-semibold">Invoice Attribution History</h2>
        <Input
          placeholder="Enter phone number"
          value={filterPhone}
          onChange={e => setFilterPhone(e.target.value)}
          className="w-64"
        />
        <Input
          type="date"
          value={startDate}
          max={getTodayDate()}
          onChange={e => setStartDate(e.target.value)}
        />
        <Input
          type="date"
          value={endDate}
          max={getTodayDate()}
          onChange={e => setEndDate(e.target.value)}
        />
      </div>

      {/* Summary + Graph */}
      {filterPhone.trim() && (
        <>
          <div className="flex gap-6">
            <Card className="flex-1 max-w-xs">
              <CardHeader>
                <CardTitle>Total Invoiced</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-bold">₹{totalAmount}</CardContent>
            </Card>

            <Card className="flex-1">
              <CardHeader>
                <CardTitle>Monthly Invoices</CardTitle>
              </CardHeader>
              <CardContent className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTotals}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="total" stroke="#16a34a" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Attribution Table */}
          <div className="overflow-auto max-h-[600px] border rounded-md">
            <table className="min-w-full border-collapse table-auto">
              <thead className="sticky top-0 bg-white dark:bg-black">
                <tr>
                  <th className="border px-3 py-2 text-left">Invoice ID</th>
                  <th className="border px-3 py-2 text-left">Phone</th>
                  <th className="border px-3 py-2 text-left">Name</th>
                  <th className="border px-3 py-2 text-left">Month</th>
                  <th className="border px-3 py-2 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {attributions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center p-4">No records found.</td>
                  </tr>
                ) : (
                  attributions.map(attr => (
                    <tr key={`${attr.invoice_id}-${attr.effective_month}`} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="border px-3 py-2">{attr.invoice_id}</td>
                      <td className="border px-3 py-2">{attr.phone}</td>
                      <td className="border px-3 py-2">{attr.name}</td>
                      <td className="border px-3 py-2">{attr.effective_month}</td>
                      <td className="border px-3 py-2 text-right">{attr.amount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
