'use client'

import { useState, useEffect, ChangeEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { supabase } from '@/lib/supabase'

function getTodayDate() {
  return new Date().toISOString().split('T')[0]
}

function getISTTimestamp() {
  const now = new Date()
  const offsetIST = 5.5 * 60 * 60 * 1000
  return new Date(now.getTime() + offsetIST - now.getTimezoneOffset() * 60000).toISOString()
}

interface Tag {
  tag_id: string
  tag_name: string
}

export default function AddExpenditureForm() {
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [paymentType, setPaymentType] = useState('')
  const [paymentRef, setPaymentRef] = useState('')
  const [tag, setTag] = useState<string | undefined>()
  const [tags, setTags] = useState<Tag[]>([])
  const [date, setDate] = useState(getTodayDate())
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const fetchTags = async () => {
      const { data, error } = await supabase.from('tags').select('tag_id, tag_name')
      if (error) console.error('Error fetching tags:', error.message)
      else setTags(data)
    }
    fetchTags()
  }, [])

  const validate = () => {
    if (!title || !amount || !paymentType || !date) return 'All fields are required.'
    if (isNaN(Number(amount))) return 'Amount must be a number.'
    if (paymentType !== 'cash' && !paymentRef) return 'Payment reference is required.'
    if (!tag) return 'Please select a tag.'
    return null
  }

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setImageFile(file)
  }

  const uploadImage = async (userId: string) => {
    if (!imageFile) return null

    const fileExt = imageFile.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const filePath = `uploads/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('expenditures')
      .upload(filePath, imageFile)

    if (uploadError) {
      throw new Error(uploadError.message)
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('expenditures').getPublicUrl(filePath)

    return publicUrl
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

    let imageUrl: string | null = null
    let filePath: string | null = null

    try {
      imageUrl = await uploadImage(user.id)
      if (imageUrl) filePath = imageUrl
    } catch (err: any) {
      setError(`Image upload failed: ${err.message}`)
      return
    }

    const actual_amt_credit_dt = paymentType === 'cheque' ? null : date

    const expenditureData = {
      title,
      amount: Number(amount),
      payment_type: paymentType,
      payment_reference: paymentType !== 'cash' ? paymentRef : null,
      tag,
      date,
      image_url: filePath,
      actual_amt_credit_dt,
    }

    const { error: insertError } = await supabase
      .from('expenditures')
      .insert(expenditureData)

    if (insertError) {
      setError(insertError.message)
    } else {
      setSuccess('Expenditure added successfully!')
      setTitle('')
      setAmount('')
      setPaymentType('')
      setPaymentRef('')
      setTag(undefined)
      setDate(getTodayDate())
      setImageFile(null)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <h2 className="text-xl font-semibold text-center">Add Expenditure</h2>

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
        <Label>Payment Type</Label>
        <Select value={paymentType} onValueChange={setPaymentType}>
          <SelectTrigger>
            <SelectValue placeholder="Select payment type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="upi">UPI</SelectItem>
            <SelectItem value="bank">Bank Transfer</SelectItem>
            <SelectItem value="cheque">Cheque</SelectItem>
            <SelectItem value="card">Card</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {paymentType !== 'cash' && (
        <div>
          <Label>Payment Reference</Label>
          <Input
            value={paymentRef}
            onChange={e => setPaymentRef(e.target.value)}
            placeholder="Transaction ID, ref no, etc."
          />
        </div>
      )}

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
        <Label>Image (optional)</Label>
        <Input type="file" accept="image/*" onChange={handleImageChange} />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
      {success && <p className="text-green-500 text-sm">{success}</p>}

      <Button className="w-full" onClick={handleSubmit}>
        Submit
      </Button>
    </div>
  )
}
