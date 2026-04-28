import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { encryptPassword } from '@/lib/email/crypto'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  let password: string
  try {
    const body = await request.json() as { password?: unknown }
    if (typeof body.password !== 'string') {
      return NextResponse.json({ error: 'Mot de passe requis' }, { status: 400 })
    }
    password = body.password
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 })
  }
  if (!password.trim()) {
    return NextResponse.json({ error: 'Mot de passe requis' }, { status: 400 })
  }

  const encryptedPassword = encryptPassword(password.trim(), user.id)

  const { error } = await supabase
    .from('email_credentials')
    .upsert({ user_id: user.id, encrypted_password: encryptedPassword, updated_at: new Date().toISOString() })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
