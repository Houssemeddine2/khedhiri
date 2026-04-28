import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'ID invalide' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json()
  const emoji = body?.emoji as string
  if (!['❤️', '😍', '🎉'].includes(emoji)) {
    return NextResponse.json({ error: 'Emoji invalide' }, { status: 400 })
  }

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Vérifie si la réaction existe déjà
  const { data: existing } = await service
    .from('reactions_creations')
    .select('id')
    .eq('creation_id', id)
    .eq('membre_id', user.id)
    .eq('emoji', emoji)
    .maybeSingle()

  if (existing) {
    // Supprime — toggle off
    const { error: deleteError } = await service.from('reactions_creations').delete().eq('id', existing.id)
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })
    return NextResponse.json({ action: 'removed' })
  } else {
    // Insère — toggle on
    const { error } = await service.from('reactions_creations').insert({
      creation_id: id,
      membre_id: user.id,
      emoji,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ action: 'added' }, { status: 201 })
  }
}
