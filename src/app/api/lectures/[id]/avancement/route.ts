// src/app/api/lectures/[id]/avancement/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: lectureId } = await params
  if (!UUID_RE.test(lectureId)) return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  let body: { statut?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  const { statut } = body
  if (!statut || !['pas_commence', 'en_cours', 'termine'].includes(statut)) {
    return NextResponse.json({ error: 'statut invalide — valeurs acceptées : pas_commence, en_cours, termine' }, { status: 400 })
  }

  const sc = serviceClient()
  const { error } = await sc
    .from('avancement_lecture')
    .upsert(
      { lecture_id: lectureId, membre_id: user.id, statut, updated_at: new Date().toISOString() },
      { onConflict: 'lecture_id,membre_id' },
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
