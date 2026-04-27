'use server'

import { createClient } from '@/lib/supabase/server'

export async function createTutorSession(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data, error } = await supabase
    .from('tutor_sessions')
    .insert({ user_id: user.id })
    .select('id')
    .single()

  if (error || !data) throw new Error('Impossible de créer la session')
  return data.id
}

export async function deleteTutorSession(id: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  await supabase.from('tutor_sessions').delete().eq('id', id).eq('user_id', user.id)
}

export async function analyserSession(sessionId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: messages } = await supabase
    .from('tutor_messages')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(30)

  if (!messages?.length) return

  const { data: existing } = await supabase
    .from('tutor_analyses')
    .select('id')
    .eq('session_id', sessionId)
    .single()
  if (existing) return

  const { getTutorProvider } = await import('@/lib/tutor')
  const provider = getTutorProvider()
  const isAvailable = await provider.available()
  if (!isAvailable) return

  const conversation = messages
    .map(m => `${m.role === 'user' ? 'Élève' : 'Sid Ahmed'}: ${m.content}`)
    .join('\n')

  const analysePrompt = `Analyse cette session de tutorat et réponds UNIQUEMENT en JSON valide, sans aucun texte autour :
{"matiere":"<matière principale>","sujets":["<sujet1>","<sujet2>"],"difficulte":<1|2|3>,"points_forts":"<en une phrase>","points_retravailler":"<en une phrase>"}

Session :
${conversation}`

  try {
    const raw = await provider.chat('Tu es un analyseur de sessions pédagogiques. Tu réponds uniquement en JSON valide.', [
      { role: 'user', content: analysePrompt }
    ])

    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) return

    const analyse = JSON.parse(match[0]) as {
      matiere?: string
      sujets?: string[]
      difficulte?: number
      points_forts?: string
      points_retravailler?: string
    }

    await supabase.from('tutor_analyses').insert({
      session_id: sessionId,
      user_id: user.id,
      matiere: analyse.matiere ?? null,
      sujets: analyse.sujets ?? [],
      difficulte: analyse.difficulte ?? null,
      points_forts: analyse.points_forts ?? null,
      points_retravailler: analyse.points_retravailler ?? null,
    })
  } catch {
    // Analyse silencieuse — ne pas bloquer l'expérience
  }
}
