'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

interface Member {
  first_name: string
  last_name: string
  phone: string
  address: string
  [key: string]: any
  id: string
}

function generateMemberId(phone: string, name: string): string {
  return btoa(`${phone}:${name}`)
}

export default function MembersList() {
  const [members, setMembers] = useState<Member[]>([])
  const [filtered, setFiltered] = useState<Member[]>([])

  const [searchName, setSearchName] = useState('')
  const [searchPhone, setSearchPhone] = useState('')
  const [searchAddress, setSearchAddress] = useState('')

  // New member form state
  const [newFirstName, setNewFirstName] = useState('')
  const [newLastName, setNewLastName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newAddress, setNewAddress] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchMembers = async () => {
      const { data, error } = await supabase.from('members').select('*')
      if (!error && data) {
        const withIds = data.map((m: any) => ({
          ...m,
          id: generateMemberId(m.phone, `${m.first_name}${m.last_name}`),
        }))
        setMembers(withIds)
        setFiltered(withIds)
      } else {
        console.error('Error fetching members:', error?.message)
      }
    }
    fetchMembers()
  }, [])

  useEffect(() => {
    const lower = (s: string) => s?.toLowerCase() ?? ''
    const f = members.filter(m =>
      `${m.first_name} ${m.last_name}`.toLowerCase().includes(lower(searchName)) &&
      lower(m.phone).includes(lower(searchPhone)) &&
      lower(m.address).includes(lower(searchAddress))
    )
    setFiltered(f)
  }, [searchName, searchPhone, searchAddress, members])

  const handleAddMember = async () => {
    if (!newFirstName || !newLastName || !newPhone || !newAddress) {
      alert('Please fill in all fields.')
      return
    }

    if (members.some(m => m.phone === newPhone)) {
      alert('A member with this phone number already exists.')
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .from('members')
      .insert({
        first_name: newFirstName,
        last_name: newLastName,
        phone: newPhone,
        address: newAddress,
      })
      .select('*')
      .single()

    setLoading(false)

    if (error) {
      console.error('Error adding member:', error.message)
      alert('Error adding member.')
    } else if (data) {
      const newMember = {
        ...data,
        id: generateMemberId(data.phone, `${data.first_name}${data.last_name}`),
      }
      setMembers(prev => [...prev, newMember])
      setFiltered(prev => [...prev, newMember])

      setNewFirstName('')
      setNewLastName('')
      setNewPhone('')
      setNewAddress('')
    }
  }

  const handleDeleteMember = async (memberId: string, phone: string) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this member?')
    if (!confirmDelete) return

    const { error } = await supabase.from('members').delete().eq('phone', phone)

    if (error) {
      console.error('Error deleting member:', error.message)
      alert('Error deleting member.')
    } else {
      setMembers(prev => prev.filter(m => m.id !== memberId))
      setFiltered(prev => prev.filter(m => m.id !== memberId))
    }
  }

  const downloadCSV = () => {
    const headers = ['Name', 'Phone', 'Address']
    const rows = filtered.map(m => [`${m.first_name} ${m.last_name}`, m.phone, m.address])
    const csvContent = [headers, ...rows]
      .map(row => row.map(val => `"${val}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = 'members.csv'
    a.click()

    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h2 className="text-2xl font-semibold text-center">Members</h2>

      {/* Add New Member Form */}
      <div className="p-4 border rounded-md bg-muted/20 space-y-2">
        <h3 className="text-lg font-semibold">Add New Member</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <Label>First Name</Label>
            <Input value={newFirstName} onChange={e => setNewFirstName(e.target.value)} />
          </div>
          <div>
            <Label>Last Name</Label>
            <Input value={newLastName} onChange={e => setNewLastName(e.target.value)} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={newPhone} onChange={e => setNewPhone(e.target.value)} />
          </div>
          <div>
            <Label>Address</Label>
            <Input value={newAddress} onChange={e => setNewAddress(e.target.value)} />
          </div>
        </div>
        <Button onClick={handleAddMember} disabled={loading}>
          {loading ? 'Adding...' : 'Add Member'}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <Label>Name</Label>
          <Input
            placeholder="Search by name"
            value={searchName}
            onChange={e => setSearchName(e.target.value)}
          />
        </div>
        <div>
          <Label>Phone</Label>
          <Input
            placeholder="Search by phone"
            value={searchPhone}
            onChange={e => setSearchPhone(e.target.value)}
          />
        </div>
        <div>
          <Label>Address</Label>
          <Input
            placeholder="Search by address"
            value={searchAddress}
            onChange={e => setSearchAddress(e.target.value)}
          />
        </div>
        <Button onClick={downloadCSV} className="mt-1">
          ⬇️ Export CSV
        </Button>
      </div>

      {/* Members Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border text-sm">
          <thead>
            <tr className="bg-muted text-left">
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Phone</th>
              <th className="p-2 border">Address</th>
              <th className="p-2 border text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">
                  No members found.
                </td>
              </tr>
            ) : (
              filtered.map(member => (
                <tr key={member.id} className="hover:bg-muted/40">
                  <td className="p-2 border">{member.first_name} {member.last_name}</td>
                  <td className="p-2 border">{member.phone}</td>
                  <td className="p-2 border">{member.address}</td>
                  <td className="p-2 border text-center">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteMember(member.id, member.phone)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
