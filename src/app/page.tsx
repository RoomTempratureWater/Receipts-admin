'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import AddInvoiceForm from '@/components/AddInvoiceForm'
import InvoiceHistory from '@/components/InvoiceHistory'
import AddTags from '@/components/AddTags'
import { X, Menu, Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'

export default function Dashboard() {
  const [view, setView] = useState<'add' | 'history' | 'tags'>('add')
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (data?.user) {
        setUserEmail(data.user.email ?? null);
      } else {
        router.push('/login')
      }
    }
    fetchUser()
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const Sidebar = (
    <div
      className="w-60 p-4 flex flex-col gap-4 h-full border-r"
      style={{
        backgroundColor: 'var(--color-sidebar)',
        color: 'var(--color-sidebar-foreground)',
        borderColor: 'var(--color-sidebar-border)',
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Invoice App</h2>
        <button onClick={() => setSidebarOpen(false)} className="md:hidden text-inherit">
          <X />
        </button>
      </div>

      <Button
        variant={view === 'add' ? 'default' : 'outline'}
        className="bg-[--color-sidebar-primary] text-[--color-sidebar-primary-foreground] hover:bg-[--color-sidebar-accent]"
        onClick={() => {
          setView('add')
          setSidebarOpen(false)
        }}
      >
        ➕ Add
      </Button>
      <Button
        variant={view === 'history' ? 'default' : 'outline'}
        className="bg-[--color-sidebar-primary] text-[--color-sidebar-primary-foreground] hover:bg-[--color-sidebar-accent]"
        onClick={() => {
          setView('history')
          setSidebarOpen(false)
        }}
      >
        📜 History
      </Button>
      <Button
        variant={view === 'tags' ? 'default' : 'outline'}
        className="bg-[--color-sidebar-primary] text-[--color-sidebar-primary-foreground] hover:bg-[--color-sidebar-accent]"
        onClick={() => {
          setView('tags')
          setSidebarOpen(false)
        }}
      >
        🏷️ Tags
      </Button>

      <div className="mt-auto text-sm pt-4 border-t" style={{ borderColor: 'var(--color-sidebar-border)' }}>
        <p className="mb-2">Signed in as:</p>
        <p className="font-medium break-words">{userEmail || 'Loading...'}</p>
        <Button variant="destructive" onClick={handleSignOut} className="w-full mt-4">
          🔒 Sign Out
        </Button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen relative bg-[--color-background] text-[--color-foreground]">
      {/* Sidebar for desktop */}
      <div className="hidden md:block">{Sidebar}</div>

      {/* Sidebar for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black opacity-50" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-50">{Sidebar}</div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-6 w-full">
        {/* Mobile top bar */}
        <div className="flex justify-between items-center mb-4 md:hidden">
          <Button variant="outline" onClick={() => setSidebarOpen(true)}>
            <Menu className="mr-2 h-5 w-5" /> Menu
          </Button>

          <Button variant="ghost" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
        </div>

        {/* Desktop theme toggle */}
        <div className="hidden md:flex justify-end mb-4">
          <Button variant="ghost" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
        </div>

        {view === 'add' && <AddInvoiceForm />}
        {view === 'history' && <InvoiceHistory />}
        {view === 'tags' && <AddTags />}
      </main>
    </div>
  )
}

