import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'ID invalide' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: creation, error: fetchError } = await supabase
    .from('creations')
    .select('id, author_id, media_url')
    .eq('id', id)
    .eq('author_id', user.id)
    .maybeSingle()

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })
  if (!creation) return NextResponse.json({ error: 'Création introuvable' }, { status: 404 })

  // Utilise le client utilisateur (même logique que createMediaPost dans posts.ts)
  const { error: postError } = await supabase.from('posts').insert({
    author_id: user.id,
    type: 'photo',
    media_url: creation.media_url,
  })

  if (postError) return NextResponse.json({ error: postError.message }, { status: 500 })
  return NextResponse.json({ success: true }, { status: 201 })
}
