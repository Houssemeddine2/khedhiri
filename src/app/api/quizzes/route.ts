// src/app/api/quizzes/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { membreById, MEMBRES } from '@/lib/membres'

type RawSession = {
  id: string
  membre_id: string
  score: number
  nb_questions: number
  termine_at: string
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
    .from('quizzes')
    .select('*, sessions_quiz(id, membre_id, score, nb_questions, termine_at), questions_quiz(id)')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const quizzes = (rows ?? []).map(row => {
    const auteur = membreById(row.auteur_id)
    const rawSessions = (row.sessions_quiz as RawSession[]) ?? []
    const sessions = rawSessions.map(s => {
      const m = membreById(s.membre_id)
      return {
        session_id: s.id,
        membre_id: s.membre_id,
        membre_nom: m?.nom ?? 'Inconnu',
        membre_email: m?.email ?? '',
        score: s.score,
        nb_questions: s.nb_questions,
        termine_at: s.termine_at,
      }
    })
    return {
      id: row.id,
      auteur_id: row.auteur_id,
      auteur_nom: auteur?.nom ?? 'Inconnu',
      auteur_email: auteur?.email ?? '',
      titre: row.titre,
      description: row.description ?? null,
      assignees: row.assignees ?? [],
      created_at: row.created_at,
      sessions,
      nb_questions: ((row.questions_quiz as RawQuestion[]) ?? []).length,
      a_joue: rawSessions.some(s => s.membre_id === user.id),
    }
  })

  return NextResponse.json({ quizzes })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  let body: {
    titre?: string
    description?: string
    assignees?: string[]
    questions?: Array<{
      type?: string
      contenu?: string
      options?: string[]
      bonne_reponse?: string
      ordre?: number
    }>
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  const { titre, description, assignees, questions } = body

  if (!titre?.trim()) return NextResponse.json({ error: 'titre requis' }, { status: 400 })
  if (!questions || questions.length === 0) {
    return NextResponse.json({ error: 'Au moins une question requise' }, { status: 400 })
  }
  if (questions.length > 20) {
    return NextResponse.json({ error: 'Maximum 20 questions par quiz' }, { status: 400 })
  }

  for (const q of questions) {
    if (!q.type || !['qcm', 'vrai_faux', 'ouverte'].includes(q.type)) {
      return NextResponse.json({ error: 'type de question invalide' }, { status: 400 })
    }
    if (!q.contenu?.trim()) {
      return NextResponse.json({ error: 'contenu de question requis' }, { status: 400 })
    }
    if (q.type === 'qcm') {
      if (!q.options || q.options.length < 2 || q.options.length > 4) {
        return NextResponse.json({ error: 'qcm requiert 2 à 4 options' }, { status: 400 })
      }
      if (!q.bonne_reponse?.trim()) {
        return NextResponse.json({ error: 'bonne_reponse requise pour qcm' }, { status: 400 })
      }
      if (!q.options!.includes(q.bonne_reponse!.trim())) {
        return NextResponse.json({ error: "bonne_reponse doit être l'une des options" }, { status: 400 })
      }
    }
    if (q.type === 'vrai_faux') {
      if (!q.bonne_reponse || !['vrai', 'faux'].includes(q.bonne_reponse)) {
        return NextResponse.json({ error: 'bonne_reponse doit être "vrai" ou "faux" pour vrai_faux' }, { status: 400 })
      }
    }
  }

  const VALID_IDS = new Set(MEMBRES.map(m => m.id))
  if (assignees && !assignees.every(id => VALID_IDS.has(id))) {
    return NextResponse.json({ error: 'assignee inconnu' }, { status: 400 })
  }

  const sc = serviceClient()
  const { data: quiz, error: quizError } = await sc
    .from('quizzes')
    .insert({
      auteur_id: user.id,
      titre: titre.trim(),
      description: description?.trim() || null,
      assignees: assignees ?? [],
    })
    .select('id')
    .single()

  if (quizError) return NextResponse.json({ error: quizError.message }, { status: 500 })

  const questionsToInsert = questions.map((q, index) => ({
    quiz_id: quiz.id,
    type: q.type!,
    contenu: q.contenu!.trim(),
    options: q.type === 'qcm' ? q.options! : null,
    bonne_reponse: q.type === 'ouverte' ? null : q.bonne_reponse ?? null,
    ordre: q.ordre ?? index + 1,
  }))

  const { error: qError } = await sc
    .from('questions_quiz')
    .insert(questionsToInsert)

  if (qError) return NextResponse.json({ error: qError.message }, { status: 500 })

  return NextResponse.json({ id: quiz.id }, { status: 201 })
}
