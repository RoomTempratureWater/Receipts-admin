// lib/auth.ts
import { supabase } from './supabase'

export async function getUserSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

