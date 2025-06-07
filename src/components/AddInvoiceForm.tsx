'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

function getTodayDate() {
  return new Date().toISOString().split('T')[0]
}

interface Tag {
  tag_id: string
  tag_name: string
}

export default function AddInvoiceForm() {
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(getTodayDate())
  const [tag, setTag] = useState<string | undefined>()
  const [tags, setTags] = useState<Tag[]>([])

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const fetchTags = async () => {
      const { data, error } = await supabase.from('tags').select('tag_id, tag_name')
      if (error) {
        console.error('Error fetching tags:', error.message)
      } else {
        setTags(data)
      }
    }
    fetchTags()
  }, [])

  const validate = () => {
    if (!/^\d{10}$/.test(phone)) {
      return 'Phone number must be exactly 10 digits.'
    }
    if (!name || !title || !amount || !date) {
      return 'All fields are required, including the date.'
    }
    if (!tag) {
      return 'Please select a tag.'
    }
    if (isNaN(Number(amount))) {
      return 'Amount must be a number.'
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

    const { error: insertError } = await supabase.from('invoices').insert({
      phone,
      name,
      title,
      amount: Number(amount),
      created_at: date,
      tag: tag,
    })

    if (insertError) {
      setError(insertError.message)
    } else {
      setSuccess('Invoice added successfully!')
      setPhone('')
      setName('')
      setTitle('')
      setAmount('')
      setDate(getTodayDate())
      setTag(undefined)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <h2 className="text-xl font-semibold text-center">Add Invoice</h2>

      <div>
        <Label>Phone Number</Label>
        <Input
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="10-digit phone number"
          maxLength={10}
        />
      </div>

      <div>
        <Label>Name</Label>
        <Input value={name} onChange={e => setName(e.target.value)} />
      </div>

      <div>
        <Label>Title</Label>
        <Input value={title} onChange={e => setTitle(e.target.value)} />
      </div>

      <div>
        <Label>Amount</Label>
        <Input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />
      </div>

      <div>
        <Label>Date</Label>
        <Input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          max={getTodayDate()}
        />
      </div>

      <div>
        <Label>Tag</Label>
        <Select value={tag} onValueChange={setTag}>
          <SelectTrigger>
            <SelectValue placeholder="Select a tag" />
          </SelectTrigger>
          <SelectContent>
            {tags.map(t => (
              <SelectItem key={t.tag_id} value={t.tag_id}>
                {t.tag_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
      {success && <p className="text-green-500 text-sm">{success}</p>}

      <Button className="w-full" onClick={handleSubmit}>
        Submit
      </Button>
    </div>
  )
}

