// src/app/api/lectures/[id]/questions/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { membreById } from '@/lib/membres'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type RawReponse = {
  id: string
  question_id: string
  auteur_id: string
  contenu: string
  created_at: string
}

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: lectureId } = await params
  if (!UUID_RE.test(lectureId)) return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: rows, error } = await supabase
    .from('questions_lecture')
    .select('*, reponses_questions(*)')
    .eq('lecture_id', lectureId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const questions = (rows ?? []).map(row => {
    const auteur = membreById(row.auteur_id)
    const reponses = ((row.reponses_questions as RawReponse[]) ?? []).map(r => {
      const rAuteur = membreById(r.auteur_id)
      return {
        id: r.id,
        question_id: r.question_id,
        auteur_id: r.auteur_id,
        auteur_nom: rAuteur?.nom ?? 'Inconnu',
        auteur_email: rAuteur?.email ?? '',
        contenu: r.contenu,
        created_at: r.created_at,
      }
    })
    return {
      id: row.id,
      lecture_id: row.lecture_id,
      auteur_id: row.auteur_id,
      auteur_nom: auteur?.nom ?? 'Inconnu',
      auteur_email: auteur?.email ?? '',
      contenu: row.contenu,
      created_at: row.created_at,
      reponses,
    }
  })

  return NextResponse.json({ questions })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: lectureId } = await params
  if (!UUID_RE.test(lectureId)) return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  let body: { contenu?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  if (!body.contenu?.trim()) return NextResponse.json({ error: 'contenu requis' }, { status: 400 })

  const sc = serviceClient()
  const { data, error } = await sc
    .from('questions_lecture')
    .insert({ lecture_id: lectureId, auteur_id: user.id, contenu: body.contenu.trim() })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id }, { status: 201 })
}
