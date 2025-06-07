'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function AddTags() {
  const [tags, setTags] = useState<any[]>([])
  const [newTag, setNewTag] = useState('')
  const [editingTagId, setEditingTagId] = useState<string | null>(null)
  const [editingTagName, setEditingTagName] = useState('')

  const fetchTags = async () => {
    const { data } = await supabase.from('tags').select('*').order('created_at', { ascending: false })
    setTags(data || [])
  }

  useEffect(() => {
    fetchTags()
  }, [])

  const handleAddTag = async () => {
    if (!newTag.trim()) return
    const { error } = await supabase.from('tags').insert({ tag_name: newTag.trim() })
    if (!error) {
      setNewTag('')
      fetchTags()
    }
  }

  const handleEdit = (tagId: string, currentName: string) => {
    setEditingTagId(tagId)
    setEditingTagName(currentName)
  }

  const handleSave = async (tagId: string) => {
    const { error } = await supabase.from('tags').update({ tag_name: editingTagName }).eq('tag_id', tagId)
    if (!error) {
      setEditingTagId(null)
      setEditingTagName('')
      fetchTags()
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h2 className="text-xl font-semibold text-center">Manage Tags</h2>

      <div className="flex gap-2">
        <Input
          placeholder="New tag name"
          value={newTag}
          onChange={e => setNewTag(e.target.value)}
        />
        <Button onClick={handleAddTag}>Add</Button>
      </div>

      <Card className="p-4 space-y-2">
        <h3 className="text-lg font-medium mb-2">Tags List</h3>
        {tags.map(tag => (
          <div
            key={tag.tag_id}
            className="flex items-center justify-between border-b pb-2"
          >
            {editingTagId === tag.tag_id ? (
              <>
                <Input
                  value={editingTagName}
                  onChange={e => setEditingTagName(e.target.value)}
                  className="flex-1 mr-2"
                />
                <Button size="sm" onClick={() => handleSave(tag.tag_id)}>
                  Save
                </Button>
              </>
            ) : (
              <>
                <p className="flex-1">{tag.tag_name}</p>
                <Button variant="outline" size="sm" onClick={() => handleEdit(tag.tag_id, tag.tag_name)}>
                  Edit
                </Button>
              </>
            )}
          </div>
        ))}
      </Card>
    </div>
  )
}

