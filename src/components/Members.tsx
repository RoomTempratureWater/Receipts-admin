'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

interface Member {
  name: string
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

  useEffect(() => {
    const fetchMembers = async () => {
      const { data, error } = await supabase.from('members').select('*')
      if (!error && data) {
        const withIds = data.map((m: any) => ({
          ...m,
          id: generateMemberId(m.phone, m.name),
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
      lower(m.name).includes(lower(searchName)) &&
      lower(m.phone).includes(lower(searchPhone)) &&
      lower(m.address).includes(lower(searchAddress))
    )
    setFiltered(f)
  }, [searchName, searchPhone, searchAddress, members])

  const downloadCSV = () => {
    const headers = ['Name', 'Phone', 'Address']
    const rows = filtered.map(m => [m.name, m.phone, m.address])
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

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border text-sm">
          <thead>
            <tr className="bg-muted text-left">
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Phone</th>
              <th className="p-2 border">Address</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-4 text-center text-gray-500">
                  No members found.
                </td>
              </tr>
            ) : (
              filtered.map(member => (
                <tr key={member.id} className="hover:bg-muted/40">
                  <td className="p-2 border">{member.name}</td>
                  <td className="p-2 border">{member.phone}</td>
                  <td className="p-2 border">{member.address}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
