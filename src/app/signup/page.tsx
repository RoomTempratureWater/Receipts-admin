// app/signup/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'



export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [key, setKey] = useState('')
  const [error, setError] = useState('')
  // const [hashedKeys, setHashedKey] = useState('')
  const [verify, setverify] = useState<boolean>(false)
  const router = useRouter()
  const [key_error, setkey_error] = useState('')

  async function verifyPassword(password: string) {
    const res = await fetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
  
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
  
    const data = await res.json();
    return data.message; // true if verified, false otherwise
  }
  const handleSignup = async () => {
    let isValid = false
    try{
      isValid = await verifyPassword(key)
      if (isValid == true) {
        setverify(true)
        console.log(verify);
        }
    } catch (err) {
      setkey_error(err instanceof Error ? err.message : String(err));
    }
    
    if (isValid == true) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else {
        alert("account created succesfully! login now")
        router.push('/')
      }
    } else {
      console.log("key didnt match")
      setkey_error("Incorrect Key! ")
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <div className="w-80 space-y-4">
        <h2 className="text-xl font-semibold text-center">Sign Up</h2>
        <Label>Email</Label>
        <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
        <Label>Password</Label>
        <Input type="password" value={password} onChange={e => setPassword(e.target.value)} />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <Label>Key</Label>
        <Input type="key" value={key} onChange={e => setKey(e.target.value)} />
        {key_error && <p className="text-red-500 text-sm">{key_error}</p>}
        {setverify == true && <p className="text-green-500 text-sm">key is verified!</p>}
        <Button onClick={handleSignup} className="w-full">Create Account</Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push('/login')}
        >
          Back to Login
        </Button>
      </div>
    </div>
  )
}

