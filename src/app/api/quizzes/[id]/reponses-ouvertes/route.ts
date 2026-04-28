// src/app/api/quizzes/[id]/reponses-ouvertes/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { membreById } from '@/lib/membres'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: quizId } = await params

  if (!UUID_RE.test(quizId)) {
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

  const { data: rows, error } = await supabase
    .from('reponses_quiz')
    .select(`
      id,
      session_id,
      question_id,
      contenu,
      correct,
      sessions_quiz!inner(membre_id, quiz_id),
      questions_quiz!inner(contenu, type)
    `)
    .eq('sessions_quiz.quiz_id', quizId)
    .eq('questions_quiz.type', 'ouverte')
    .is('correct', null)
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  type RawRow = {
    id: string
    session_id: string
    question_id: string
    contenu: string
    correct: boolean | null
    sessions_quiz: { membre_id: string; quiz_id: string }
    questions_quiz: { contenu: string; type: string }
  }

  const reponses = ((rows ?? []) as unknown as RawRow[]).map(r => {
    const m = membreById(r.sessions_quiz.membre_id)
    return {
      id: r.id,
      session_id: r.session_id,
      question_id: r.question_id,
      question_contenu: r.questions_quiz.contenu,
      membre_nom: m?.nom ?? 'Inconnu',
      membre_email: m?.email ?? '',
      contenu: r.contenu,
      correct: r.correct,
    }
  })

  return NextResponse.json({ reponses })
}
