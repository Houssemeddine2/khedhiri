import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const sc = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: vocal } = await sc
    .from('vocaux')
    .select('vocal_path')
    .eq('id', id)
    .eq('proprietaire_id', user.id)
    .maybeSingle()

  if (!vocal) return NextResponse.json({ error: 'Vocal non trouvé' }, { status: 404 })

  const { error: storageError } = await sc.storage.from('calins').remove([vocal.vocal_path])
  if (storageError) {
    return NextResponse.json({ error: 'Erreur suppression audio' }, { status: 500 })
  }

  const { data: deleted, error } = await sc
    .from('vocaux')
    .delete()
    .eq('id', id)
    .eq('proprietaire_id', user.id)
    .select('id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!deleted?.length) return NextResponse.json({ error: 'Vocal non trouvé' }, { status: 404 })

  return NextResponse.json({ ok: true })
}
