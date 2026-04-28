// src/app/api/lectures/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { membreById, MEMBRES } from '@/lib/membres'

type RawAvancement = {
  membre_id: string
  statut: string
  updated_at: string
}

type RawQuestion = { id: string }

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: rows, error } = await supabase
    .from('lectures')
    .select('*, avancement_lecture(*), questions_lecture(id)')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const lectures = (rows ?? []).map(row => {
    const auteur = membreById(row.auteur_id)
    const rawAvancements = (row.avancement_lecture as RawAvancement[]) ?? []
    const avancements = MEMBRES.map(m => {
      const found = rawAvancements.find(a => a.membre_id === m.id)
      return {
        membre_id: m.id,
        membre_nom: m.nom,
        membre_email: m.email,
        statut: (found?.statut ?? 'pas_commence') as 'pas_commence' | 'en_cours' | 'termine',
      }
    })
    return {
      id: row.id,
      auteur_id: row.auteur_id,
      auteur_nom: auteur?.nom ?? 'Inconnu',
      auteur_email: auteur?.email ?? '',
      titre: row.titre,
      auteur_livre: row.auteur_livre,
      description: row.description ?? null,
      couverture_url: row.couverture_url ?? null,
      assignees: row.assignees ?? [],
      created_at: row.created_at,
      avancements,
      nb_questions: ((row.questions_lecture as RawQuestion[]) ?? []).length,
    }
  })

  return NextResponse.json({ lectures })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  let body: {
    titre?: string
    auteur_livre?: string
    description?: string
    couverture_url?: string
    assignees?: string[]
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  const { titre, auteur_livre, description, couverture_url, assignees } = body

  if (!titre?.trim()) return NextResponse.json({ error: 'titre requis' }, { status: 400 })
  if (!auteur_livre?.trim()) return NextResponse.json({ error: 'auteur_livre requis' }, { status: 400 })

  const sc = serviceClient()
  const { data, error } = await sc
    .from('lectures')
    .insert({
      auteur_id: user.id,
      titre: titre.trim(),
      auteur_livre: auteur_livre.trim(),
      description: description?.trim() || null,
      couverture_url: couverture_url?.trim() || null,
      assignees: assignees ?? [],
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id }, { status: 201 })
}
