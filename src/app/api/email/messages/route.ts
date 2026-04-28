import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { decryptPassword } from '@/lib/email/crypto'
import { fetchMessages } from '@/lib/email/imap'

const PAPA_EMAIL = 'houssem@khedhiri.me'

export const maxDuration = 30

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const folder = searchParams.get('folder') ?? 'INBOX'
  if (/[\r\n"\\]/.test(folder)) {
    return NextResponse.json({ error: 'Dossier invalide' }, { status: 400 })
  }
  const page = Number(searchParams.get('page') ?? '1')
  if (!Number.isInteger(page) || page < 1) {
    return NextResponse.json({ error: 'Paramètre page invalide' }, { status: 400 })
  }

  const allowedFolder = user.email === PAPA_EMAIL ? folder : 'INBOX'

  const { data: creds } = await supabase
    .from('email_credentials')
    .select('encrypted_password')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!creds) return NextResponse.json({ error: 'Boîte non configurée' }, { status: 404 })

  try {
    const password = decryptPassword(creds.encrypted_password, user.id)
    const messages = await fetchMessages(user.email!, password, allowedFolder, page)
    return NextResponse.json({ messages })
  } catch (err) {
    console.error('IMAP error:', err)
    return NextResponse.json({ error: 'Impossible de se connecter à la boîte mail' }, { status: 500 })
  }
}
