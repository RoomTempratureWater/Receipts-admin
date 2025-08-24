'use client'

import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { printInvoice } from '@/lib/print_invoice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

function getTodayDate() {
  return new Date().toISOString().split('T')[0]
}

interface Tag {
  tag_id: string
  tag_name: string
}

interface Member {
  id: string
  first_name: string
  last_name: string
  address: string
}

export default function AddInvoiceForm() {
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(getTodayDate())
  const [tag, setTag] = useState<string | undefined>()
  const [tags, setTags] = useState<Tag[]>([])
  const [address, setAddress] = useState('')
  const [useRange, setUseRange] = useState(false)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [paymentType, setPaymentType] = useState('cash')
  const [paymentReference, setPaymentReference] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [memberSuggestions, setMemberSuggestions] = useState<Member[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [lastChurchFundDate, setLastChurchFundDate] = useState<string | null>(null)

  const selectedTagName = tags.find(t => t.tag_id === tag)?.tag_name

  useEffect(() => {
    const fetchTags = async () => {
      const { data, error } = await supabase
        .from('invoice_tags')
        .select('tag_id, tag_name')
        .order('created_at', { ascending: false })
      if (!error && data) setTags(data)
    }
    fetchTags()
  }, [])

  useEffect(() => {
    const fetchMembers = async () => {
      const trimmedPhone = phone.trim()
      if (/^\d{10}$/.test(trimmedPhone)) {
        const { data, error } = await supabase
          .from('members')
          .select('id, first_name, last_name, address')
          .eq('phone', trimmedPhone)
          .order('created_at', { ascending: false })

        if (!error && data) {
          setMemberSuggestions(data)
          setShowSuggestions(true)
        } else {
          setMemberSuggestions([])
          setShowSuggestions(false)
        }
      } else {
        setMemberSuggestions([])
        setShowSuggestions(false)
      }
    }

    fetchMembers()
  }, [phone])

  useEffect(() => {
    const fetchLastChurchFundDate = async () => {
      const trimmedPhone = phone.trim()
      if (selectedTagName === 'Church Fund' && /^\d{10}$/.test(trimmedPhone)) {
        const { data, error } = await supabase
          .from('invoice_attributions')
          .select('effective_month')
          .eq('phone', trimmedPhone)
          .order('effective_month', { ascending: false })
          .limit(1)

        if (!error && data && data.length > 0) {
          const formatted = format(new Date(data[0].effective_month), 'MMMM')
          setLastChurchFundDate(formatted)
        } else {
          setLastChurchFundDate(null)
        }
      } else {
        setLastChurchFundDate(null)
      }
    }

    fetchLastChurchFundDate()
  }, [selectedTagName, phone])

  const validate = () => {
    const trimmedPhone = phone.trim()
    if (trimmedPhone && !/^\d{10}$/.test(trimmedPhone)) return 'Phone number must be exactly 10 digits if provided.'
    if (!title || !amount || !date) return 'Title, Amount, and Date are required.'
    if (!tag) return 'Please select a tag.'
    if (isNaN(Number(amount))) return 'Amount must be a number.'
    if (paymentType !== 'cash' && !paymentReference) return 'Payment reference is required for non-cash payments.'
    if (selectedTagName === 'Church Fund' && useRange && (!fromDate || !toDate)) {
      return 'From and To dates are required when using a date range.'
    }
    return null
  }

  const handleSubmit = async () => {
    setError('')
    setSuccess('')
    const err = validate()
    if (err) {
      setError(err)
      return
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (!user || userError) {
      setError('User not authenticated.')
      return
    }

    const useValidRange = useRange && fromDate && toDate

    const invoiceData = {
      phone: phone.trim() || null,
      name: name || null,
      title,
      amount: Number(amount),
      date,
      tag, // this is tag_id from invoice_tags
      address: address || null,
      effective_from: useValidRange ? fromDate : null,
      effective_to: useValidRange ? toDate : null,
      user_id: user.id,
      payment_type: paymentType,
      payment_reference: paymentType !== 'cash' ? paymentReference : null,
      actual_amt_credit_dt: paymentType === 'cheque' ? null : date,
    }

    const { data: inserted, error: insertError } = await supabase
      .rpc('insert_invoice_with_short_id', invoiceData)
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
    } else {
      setSuccess('Invoice added successfully!')
      printInvoice(inserted)
      setPhone('')
      setName('')
      setTitle('')
      setAmount('')
      setDate(getTodayDate())
      setFromDate('')
      setToDate('')
      setAddress('')
      setTag(undefined)
      setUseRange(false)
      setPaymentType('cash')
      setPaymentReference('')
      setLastChurchFundDate(null)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <h2 className="text-xl font-semibold text-center">Add Invoice</h2>

      <div>
        <Label>Phone Number (optional)</Label>
        <Input
          value={phone}
          onChange={e => setPhone(e.target.value)}
          maxLength={10}
        />
        {showSuggestions && memberSuggestions.length > 0 && (
          <div className="border rounded bg-white shadow max-h-40 overflow-y-auto text-sm mt-1 z-10 relative">
            {memberSuggestions.map(member => (
              <div
                key={member.id}
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  setName(`${member.first_name} ${member.last_name}`)
                  setAddress(member.address)
                  setShowSuggestions(false)
                }}
              >
                {member.first_name} {member.last_name}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <Label>Name (optional)</Label>
        <Input value={name} onChange={e => setName(e.target.value)} />
      </div>

      <div>
        <Label>Address (optional)</Label>
        <Input value={address} onChange={e => setAddress(e.target.value)} />
      </div>

      <div>
        <Label>Title</Label>
        <Input value={title} onChange={e => setTitle(e.target.value)} />
      </div>

      <div>
        <Label>Amount</Label>
        <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} />
      </div>

      <div>
        <Label>Date</Label>
        <Input type="date" value={date} onChange={e => setDate(e.target.value)} max={getTodayDate()} />
      </div>

      <div>
        <Label>Tag</Label>
        <Select value={tag} onValueChange={setTag}>
          <SelectTrigger><SelectValue placeholder="Select a tag" /></SelectTrigger>
          <SelectContent>
            {tags.map(t => (
              <SelectItem key={t.tag_id} value={t.tag_id}>{t.tag_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Payment Type</Label>
        <Select value={paymentType} onValueChange={setPaymentType}>
          <SelectTrigger><SelectValue placeholder="Select payment type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="cheque">Cheque</SelectItem>
            <SelectItem value="upi">UPI</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {paymentType !== 'cash' && (
        <div>
          <Label>Payment Reference</Label>
          <Input
            value={paymentReference}
            onChange={e => setPaymentReference(e.target.value)}
            placeholder={paymentType === 'cheque' ? 'Cheque number' : 'UPI ID'}
          />
        </div>
      )}

      {selectedTagName === 'Church Fund' && (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            Last church fund paid in: {lastChurchFundDate ?? 'null'}
          </p>
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={useRange}
              onCheckedChange={checked => setUseRange(Boolean(checked))}
              id="use-range"
            />
            <Label htmlFor="use-range">Paying for a range of months</Label>
          </div>
          {useRange && (
            <>
              <div>
                <Label>From (Start Month)</Label>
                <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
              </div>
              <div>
                <Label>To (End Month)</Label>
                <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
              </div>
            </>
          )}
        </div>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}
      {success && <p className="text-green-500 text-sm">{success}</p>}

      <Button className="w-full" onClick={handleSubmit}>Submit</Button>
    </div>
  )
}
