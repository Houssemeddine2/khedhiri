// src/app/api/pronote/credentials/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const PAPA_EMAIL = 'houssem@khedhiri.me'

async function encrypt(text: string): Promise<string> {
  const { subtle } = await import('crypto')
  const keyRaw = Buffer.from(process.env.PRONOTE_ENCRYPTION_KEY!, 'hex')
  const key = await subtle.importKey('raw', keyRaw, 'AES-GCM', false, ['encrypt'])
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(text)
  const cipher = await subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)
  const combined = new Uint8Array(iv.byteLength + cipher.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(cipher), iv.byteLength)
  return Buffer.from(combined).toString('base64')
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== PAPA_EMAIL) {
    return NextResponse.json({ error: 'Réservé à Papa' }, { status: 403 })
  }

  const { userId, url, username, password } = await request.json() as {
    userId: string
    url: string
    username: string
    password: string
  }

  const passwordEncrypted = await encrypt(password)

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { error } = await admin
    .from('profiles')
    .update({
      pronote_url: url,
      pronote_username: username,
      pronote_password_encrypted: passwordEncrypted,
    })
    .eq('id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
