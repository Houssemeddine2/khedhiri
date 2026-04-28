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
