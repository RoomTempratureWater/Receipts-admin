'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

interface Tag {
  tag_id: string
  tag_name: string
}

interface Expenditure {
  id: string
  title: string
  amount: number
  payment_type: string
  payment_reference?: string
  tag: string
  date: string
  image_url?: string
  signed_image_url?: string | null
}

export default function ExpenditureHistory() {
  const [userId, setUserId] = useState<string | null>(null)
  const [expenditures, setExpenditures] = useState<Expenditure[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [allSelected, setAllSelected] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData?.user
      if (!user) return
      setUserId(user.id)

      const { data: tagData } = await supabase.from('tags').select('tag_id, tag_name')
      if (tagData) {
        setTags(tagData)
        setSelectedTags(tagData.map(t => t.tag_id))
        setAllSelected(true)
      }
    }
    init()
  }, [])

  useEffect(() => {
    const fetchExpenditures = async () => {
      if (!userId) return

      let query = supabase
        .from('expenditures')
        .select('*')
        .eq('user_id', userId)

      if (startDate) query = query.gte('date', startDate)
      if (endDate) query = query.lte('date', endDate)
      if (selectedTags.length > 0) query = query.in('tag', selectedTags)

      const { data, error } = await query.order('date', { ascending: false })

      if (error) {
        console.error('Error fetching expenditures:', error.message)
        return
      }

      const signed = await Promise.all(
        data.map(async exp => {
          if (!exp.image_url) return exp
          const { data: signedUrlData } = await supabase.storage
            .from('expenditures')
            .createSignedUrl(exp.image_url, 60 * 60) // 1 hour

          return {
            ...exp,
            signed_image_url: signedUrlData?.signedUrl ?? null,
          }
        })
      )

      setExpenditures(signed)
    }

    fetchExpenditures()
  }, [userId, startDate, endDate, selectedTags])

  const toggleTag = (tagId: string) => {
    const updated = selectedTags.includes(tagId)
      ? selectedTags.filter(t => t !== tagId)
      : [...selectedTags, tagId]

    setSelectedTags(updated)
    setAllSelected(updated.length === tags.length)
  }

  const toggleAllTags = () => {
    if (allSelected) {
      setSelectedTags([])
      setAllSelected(false)
    } else {
      setSelectedTags(tags.map(t => t.tag_id))
      setAllSelected(true)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-semibold text-center">Expenditure History</h2>

      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <Label>Start Date</Label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div>
          <Label>End Date</Label>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        <div>
          <Label>Filter by Tags</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Select Tags ({selectedTags.length})</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="p-2 max-h-64 overflow-auto space-y-2">
              <div className="flex items-center gap-2 px-2">
                <Checkbox checked={allSelected} onCheckedChange={toggleAllTags} />
                <span className="text-sm font-medium">Select All</span>
              </div>
              {tags.map(tag => (
                <div key={tag.tag_id} className="flex items-center gap-2 px-2">
                  <Checkbox
                    checked={selectedTags.includes(tag.tag_id)}
                    onCheckedChange={() => toggleTag(tag.tag_id)}
                  />
                  <span className="text-sm">{tag.tag_name}</span>
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="space-y-3">
        {expenditures.length === 0 ? (
          <p className="text-center text-gray-500">No expenditures found.</p>
        ) : (
          expenditures.map(exp => (
            <Card key={exp.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{exp.title}</span>
                  <span className="text-green-600 font-medium">₹{exp.amount}</span>
                </div>
                <div className="text-sm text-gray-600">
                  {exp.payment_type.toUpperCase()}
                  {exp.payment_reference && ` - ${exp.payment_reference}`}
                </div>
                <div className="text-sm text-gray-500">📅 {exp.date}</div>

                {exp.signed_image_url && (
                  <div className="mt-2">
                    <img
                      src={exp.signed_image_url}
                      alt="Expenditure image"
                      className="rounded-lg border max-h-80 object-contain"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
