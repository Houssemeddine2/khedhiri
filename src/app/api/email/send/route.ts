import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { decryptPassword } from '@/lib/email/crypto'
import { sendEmail } from '@/lib/email/smtp'

export const maxDuration = 30

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  let to: string, subject: string, body: string
  try {
    const parsed = await request.json() as { to?: unknown; subject?: unknown; body?: unknown }
    if (typeof parsed.to !== 'string' || typeof parsed.subject !== 'string' || typeof parsed.body !== 'string') {
      return NextResponse.json({ error: 'Champs À, Sujet et Corps requis' }, { status: 400 })
    }
    to = parsed.to
    subject = parsed.subject
    body = parsed.body
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 })
  }
  if (!to.trim() || !subject.trim() || !body.trim()) {
    return NextResponse.json({ error: 'Champs À, Sujet et Corps requis' }, { status: 400 })
  }

  const { data: creds } = await supabase
    .from('email_credentials')
    .select('encrypted_password')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!creds) return NextResponse.json({ error: 'Boîte non configurée' }, { status: 404 })

  try {
    const password = decryptPassword(creds.encrypted_password, user.id)
    await sendEmail({ fromEmail: user.email!, password, to: to.trim(), subject: subject.trim(), body: body.trim() })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('SMTP error:', err)
    return NextResponse.json({ error: 'Impossible d\'envoyer le message' }, { status: 500 })
  }
}
