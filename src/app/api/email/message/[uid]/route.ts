import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { decryptPassword } from '@/lib/email/crypto'
import { fetchMessageDetail, deleteMessage } from '@/lib/email/imap'

const PAPA_ID = 'b6025d5f-77d5-4208-b489-bcc717ebc01c'

export const maxDuration = 30

export async function GET(
  request: Request,
  { params }: { params: Promise<{ uid: string }> },
) {
  const { uid } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const folder = searchParams.get('folder') ?? 'INBOX'

  const { data: creds } = await supabase
    .from('email_credentials')
    .select('encrypted_password')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!creds) return NextResponse.json({ error: 'Boîte non configurée' }, { status: 404 })

  try {
    const password = decryptPassword(creds.encrypted_password, user.id)
    const message = await fetchMessageDetail(user.email!, password, Number(uid), folder)
    if (!message) return NextResponse.json({ error: 'Message non trouvé' }, { status: 404 })
    return NextResponse.json({ message })
  } catch (err) {
    console.error('IMAP error:', err)
    return NextResponse.json({ error: 'Impossible de récupérer le message' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ uid: string }> },
) {
  const { uid } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (user.id !== PAPA_ID) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const folder = searchParams.get('folder') ?? 'INBOX'

  const { data: creds } = await supabase
    .from('email_credentials')
    .select('encrypted_password')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!creds) return NextResponse.json({ error: 'Boîte non configurée' }, { status: 404 })

  try {
    const password = decryptPassword(creds.encrypted_password, user.id)
    await deleteMessage(user.email!, password, Number(uid), folder)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('IMAP error:', err)
    return NextResponse.json({ error: 'Impossible de supprimer le message' }, { status: 500 })
  }
}
