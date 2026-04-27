// src/app/api/pronote/credentials/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const PAPA_EMAIL = 'houssem@khedhiri.me'

async function encrypt(text: string): Promise<string> {
  const { subtle, getRandomValues } = await import('crypto')
  const keyHex = process.env.PRONOTE_ENCRYPTION_KEY
  if (!keyHex || keyHex.length !== 64) throw new Error('PRONOTE_ENCRYPTION_KEY manquante ou invalide')
  const keyRaw = Buffer.from(keyHex, 'hex')
  const key = await subtle.importKey('raw', keyRaw, 'AES-GCM', false, ['encrypt'])
  const iv = getRandomValues(new Uint8Array(12))
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

  let body: { userId?: string; url?: string; username?: string; password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 })
  }
  const { userId, url, username, password } = body
  const FILLES_IDS = ['1a0967e9-91e0-48f6-a3da-752255274153', '617eff77-47ed-40e0-b784-c027183c9bee']
  if (!userId || !url || !username || !password || !FILLES_IDS.includes(userId)) {
    return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 })
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
