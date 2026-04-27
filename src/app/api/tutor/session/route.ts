import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id manquant' }, { status: 400 })

  const { data: messages } = await supabase
    .from('tutor_messages')
    .select('*')
    .eq('session_id', id)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  return NextResponse.json({ messages: messages ?? [] })
}
