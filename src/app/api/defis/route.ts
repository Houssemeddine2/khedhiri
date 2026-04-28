import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { membreById } from '@/lib/membres'

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

function photoUrl(path: string | null): string | null {
  if (!path) return null
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/defis/${path}`
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: rows, error } = await supabase
    .from('defis')
    .select('*, reponses_defis(*)')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const defis = (rows ?? []).map(row => {
    const auteur = membreById(row.auteur_id)
    const reponses = ((row.reponses_defis as any[]) ?? []).map(r => {
      const rAuteur = membreById(r.auteur_id)
      return {
        id: r.id,
        defi_id: r.defi_id,
        auteur_id: r.auteur_id,
        auteur_nom: rAuteur?.nom ?? 'Inconnu',
        auteur_email: rAuteur?.email ?? '',
        contenu: r.contenu,
        photo_url: photoUrl(r.photo_path),
        correct: r.correct,
        created_at: r.created_at,
      }
    })
    return {
      id: row.id,
      auteur_id: row.auteur_id,
      auteur_nom: auteur?.nom ?? 'Inconnu',
      auteur_email: auteur?.email ?? '',
      type: row.type as 'defi' | 'mot',
      contenu: row.contenu,
      traduction_ar: row.traduction_ar ?? null,
      indice: row.indice ?? null,
      created_at: row.created_at,
      reponses,
    }
  })

  return NextResponse.json({ defis })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  let body: { type?: string; contenu?: string; traduction_ar?: string; indice?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  const { type, contenu, traduction_ar, indice } = body

  if (!type || !['defi', 'mot'].includes(type)) {
    return NextResponse.json({ error: 'type doit être "defi" ou "mot"' }, { status: 400 })
  }
  if (!contenu?.trim()) {
    return NextResponse.json({ error: 'contenu requis' }, { status: 400 })
  }
  if (type === 'mot' && !traduction_ar?.trim()) {
    return NextResponse.json({ error: 'traduction_ar requis pour un mot bilingue' }, { status: 400 })
  }

  const sc = serviceClient()
  const { data, error } = await sc
    .from('defis')
    .insert({
      auteur_id: user.id,
      type,
      contenu: contenu.trim(),
      traduction_ar: type === 'mot' ? traduction_ar!.trim() : null,
      indice: indice?.trim() || null,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ id: data.id }, { status: 201 })
}
