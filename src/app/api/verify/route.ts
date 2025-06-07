import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import argon2 from 'argon2';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    // Fetch all hashed keys from DB
    const { data, error } = await supabase.from('keys').select('key');

    if (error) {
      return NextResponse.json({ error: error.message, message: false }, { status: 500 });
    }

    // Verify if password matches any stored hash
    for (const hashedKeyObj of data) {
      const hashedKey = hashedKeyObj.key;
      const isValid = await argon2.verify(hashedKey, password);
      if (isValid) {
        return NextResponse.json({ error: null, message: true });
      }
    }

    // No match found
    return NextResponse.json({ error: null, message: false });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Unknown error', message: false }, { status: 500 });
  }
}
