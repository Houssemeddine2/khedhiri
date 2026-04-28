// src/app/api/quizzes/[id]/sessions/[sid]/reponses/[rid]/route.ts
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
  { params }: { params: Promise<{ id: string; sid: string; rid: string }> }
) {
  const { id: quizId, sid: sessionId, rid: reponseId } = await params

  if (!UUID_RE.test(quizId) || !UUID_RE.test(sessionId) || !UUID_RE.test(reponseId)) {
    return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  // Vérifier que l'utilisateur est le créateur
  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .select('auteur_id')
    .eq('id', quizId)
    .single()

  if (quizError || !quiz) return NextResponse.json({ error: 'Quiz introuvable' }, { status: 404 })
  if (quiz.auteur_id !== user.id) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  let body: { correct?: boolean }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  if (typeof body.correct !== 'boolean') {
    return NextResponse.json({ error: 'correct (boolean) requis' }, { status: 400 })
  }

  const sc = serviceClient()

  // Vérifier que la session appartient bien à ce quiz
  const { data: sessionCheck, error: sessionCheckError } = await sc
    .from('sessions_quiz')
    .select('id')
    .eq('id', sessionId)
    .eq('quiz_id', quizId)
    .maybeSingle()

  if (sessionCheckError) return NextResponse.json({ error: sessionCheckError.message }, { status: 500 })
  if (!sessionCheck) return NextResponse.json({ error: 'Session introuvable' }, { status: 404 })

  // Vérifier que la réponse est bien une question ouverte
  const { data: repCheck, error: repCheckError } = await sc
    .from('reponses_quiz')
    .select('id, questions_quiz!inner(type)')
    .eq('id', reponseId)
    .eq('session_id', sessionId)
    .maybeSingle()

  if (repCheckError) return NextResponse.json({ error: repCheckError.message }, { status: 500 })
  if (!repCheck) return NextResponse.json({ error: 'Réponse introuvable' }, { status: 404 })

  type RepCheck = { id: string; questions_quiz: { type: string } }
  const questionType = ((repCheck as unknown as RepCheck).questions_quiz).type
  if (questionType !== 'ouverte') {
    return NextResponse.json({ error: 'Seules les réponses ouvertes peuvent être validées manuellement' }, { status: 422 })
  }

  // Mettre à jour la réponse
  const { error: repError } = await sc
    .from('reponses_quiz')
    .update({ correct: body.correct })
    .eq('id', reponseId)
    .eq('session_id', sessionId)

  if (repError) return NextResponse.json({ error: repError.message }, { status: 500 })

  // Recalculer le score de la session
  const { data: reponses, error: countError } = await sc
    .from('reponses_quiz')
    .select('correct')
    .eq('session_id', sessionId)

  if (countError) return NextResponse.json({ error: countError.message }, { status: 500 })

  const newScore = (reponses ?? []).filter(r => r.correct === true).length

  const { error: scoreError } = await sc
    .from('sessions_quiz')
    .update({ score: newScore })
    .eq('id', sessionId)

  if (scoreError) return NextResponse.json({ error: scoreError.message }, { status: 500 })

  return NextResponse.json({ score: newScore })
}
