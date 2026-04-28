// src/app/api/quizzes/[id]/questions/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 })
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: rows, error } = await supabase
    .from('questions_quiz')
    .select('id, quiz_id, type, contenu, options, ordre')
    .eq('quiz_id', id)
    .order('ordre', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // bonne_reponse intentionnellement non exposée
  const questions = (rows ?? []).map(q => ({
    id: q.id,
    quiz_id: q.quiz_id,
    type: q.type as 'qcm' | 'vrai_faux' | 'ouverte',
    contenu: q.contenu,
    options: q.options ?? null,
    ordre: q.ordre,
  }))

  return NextResponse.json({ questions })
}
