// src/app/api/quizzes/[id]/session/route.ts
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
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: quizId } = await params

  if (!UUID_RE.test(quizId)) {
    return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  // Guard anti-doublon
  const { data: existing } = await supabase
    .from('sessions_quiz')
    .select('id')
    .eq('quiz_id', quizId)
    .eq('membre_id', user.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Tu as déjà joué ce quiz' }, { status: 409 })
  }

  let body: { reponses?: Array<{ question_id?: string; contenu?: string }> }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  const { reponses } = body
  if (!reponses || reponses.length === 0) {
    return NextResponse.json({ error: 'reponses requises' }, { status: 400 })
  }

  // Récupérer les questions avec bonne_reponse via service role
  const sc = serviceClient()
  const { data: questions, error: qError } = await sc
    .from('questions_quiz')
    .select('id, type, bonne_reponse')
    .eq('quiz_id', quizId)

  if (qError) return NextResponse.json({ error: qError.message }, { status: 500 })

  const questionMap = new Map((questions ?? []).map(q => [q.id, q]))

  // Calculer correct pour qcm/vrai_faux
  const reponsesAnnotees = reponses.map(r => {
    if (!r.question_id || r.contenu === undefined) return null
    const q = questionMap.get(r.question_id)
    if (!q) return null
    let correct: boolean | null = null
    if (q.type === 'qcm' || q.type === 'vrai_faux') {
      correct = r.contenu === q.bonne_reponse
    }
    return { question_id: r.question_id, contenu: r.contenu, correct }
  }).filter(Boolean) as Array<{ question_id: string; contenu: string; correct: boolean | null }>

  const score = reponsesAnnotees.filter(r => r.correct === true).length
  const nb_questions = reponsesAnnotees.length

  // Insérer la session
  const { data: session, error: sessionError } = await sc
    .from('sessions_quiz')
    .insert({
      quiz_id: quizId,
      membre_id: user.id,
      score,
      nb_questions,
    })
    .select('id')
    .single()

  if (sessionError) return NextResponse.json({ error: sessionError.message }, { status: 500 })

  // Insérer les réponses
  const reponsesToInsert = reponsesAnnotees.map(r => ({
    session_id: session.id,
    question_id: r.question_id,
    contenu: r.contenu,
    correct: r.correct,
  }))

  const { error: repError } = await sc
    .from('reponses_quiz')
    .insert(reponsesToInsert)

  if (repError) return NextResponse.json({ error: repError.message }, { status: 500 })

  return NextResponse.json({ score, nb_questions, session_id: session.id }, { status: 201 })
}
