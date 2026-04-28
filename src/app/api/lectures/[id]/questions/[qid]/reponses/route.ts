// src/app/api/lectures/[id]/questions/[qid]/reponses/route.ts
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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; qid: string }> },
) {
  const { id: lectureId, qid: questionId } = await params
  if (!UUID_RE.test(lectureId) || !UUID_RE.test(questionId)) {
    return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 })
  }

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

  const { data: existing } = await sc
    .from('reponses_questions')
    .select('id')
    .eq('question_id', questionId)
    .eq('auteur_id', user.id)
    .maybeSingle()

  if (existing) return NextResponse.json({ error: 'Tu as déjà répondu à cette question' }, { status: 409 })

  const { data, error } = await sc
    .from('reponses_questions')
    .insert({ question_id: questionId, auteur_id: user.id, contenu: body.contenu.trim() })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id }, { status: 201 })
}
