import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTutorProvider } from '@/lib/tutor'
import { systemPrompt, type ProfilEleve, type ContextePronote } from '@/lib/tutor/prompts'
import type { ChatMessage, TutorMessage } from '@/types/tutor'

async function getContextePronote(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
): Promise<ContextePronote> {
  const now = new Date()
  const dans2j = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
  const dans7j = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const il7j   = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [devoirs, absences, notes, controles] = await Promise.all([
    supabase.from('pronote_devoirs').select('matiere, date_rendu').eq('user_id', userId).eq('fait', false).lte('date_rendu', dans2j.toISOString().split('T')[0]),
    supabase.from('pronote_absences').select('cours').eq('user_id', userId).gte('date_debut', il7j.toISOString()),
    supabase.from('pronote_notes').select('matiere, note').eq('user_id', userId).gte('date', il7j.toISOString().split('T')[0]).order('date', { ascending: false }),
    supabase.from('pronote_evenements').select('titre').eq('user_id', userId).eq('type', 'controle').gte('date_debut', now.toISOString()).lte('date_debut', dans7j.toISOString()),
  ])

  const notesParMatiere: Record<string, number[]> = {}
  for (const n of (notes.data ?? [])) {
    if (!notesParMatiere[n.matiere]) notesParMatiere[n.matiere] = []
    notesParMatiere[n.matiere].push(n.note)
  }
  const notesEnBaisse = Object.entries(notesParMatiere)
    .filter(([, ns]) => ns.length >= 2 && (ns[0] - ns[1]) <= -2)
    .map(([m]) => m)

  return {
    devoirsAujourdhui: (devoirs.data ?? []).map((d: { matiere: string }) => d.matiere),
    coursRates: [...new Set((absences.data ?? []).map((a: { cours: string | null }) => a.cours).filter(Boolean) as string[])],
    notesEnBaisse,
    prochainsControles: (controles.data ?? []).map((e: { titre: string }) => e.titre),
  }
}

export const maxDuration = 60

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const emailPapa = 'houssem@khedhiri.me'
  if (user.email === emailPapa) {
    return NextResponse.json({ error: 'Papa ne peut pas utiliser le tuteur' }, { status: 403 })
  }

  const { sessionId, content, imageUrl } = await request.json() as {
    sessionId: string
    content: string
    imageUrl?: string
  }

  // Récupère l'historique de la session (max 20 derniers messages)
  const { data: history } = await supabase
    .from('tutor_messages')
    .select('role, content, image_url')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(20)

  // Construit l'historique OpenAI
  const chatHistory: ChatMessage[] = (history ?? []).map(m => {
    if (m.image_url && m.role === 'user') {
      return {
        role: 'user' as const,
        content: [
          { type: 'text' as const, text: m.content },
          { type: 'image_url' as const, image_url: { url: m.image_url } },
        ],
      }
    }
    return { role: m.role as 'user' | 'assistant', content: m.content }
  })

  // Ajoute le message courant
  const userMsg: ChatMessage = imageUrl
    ? { role: 'user', content: [{ type: 'text', text: content }, { type: 'image_url', image_url: { url: imageUrl } }] }
    : { role: 'user', content }

  chatHistory.push(userMsg)

  // Détermine le profil élève
  const profil: ProfilEleve = user.email === 'sandra@khedhiri.me'
    ? 'sandra' : user.email === 'sarah@khedhiri.me'
    ? 'sarah' : 'inconnu'

  // Sauvegarde le message utilisateur
  await supabase.from('tutor_messages').insert({
    session_id: sessionId,
    user_id: user.id,
    role: 'user',
    content,
    image_url: imageUrl ?? null,
  })

  // Appel au LLM
  let reply: string
  try {
    const contexte = await getContextePronote(supabase, user.id)
    const provider = getTutorProvider()
    reply = await provider.chat(systemPrompt(profil, contexte), chatHistory)
  } catch (err) {
    console.error('Tutor LLM error:', err)
    reply = 'Oups, je n\'arrive pas à répondre maintenant 😕 Réessaie dans quelques instants !'
  }

  // Sauvegarde la réponse
  await supabase.from('tutor_messages').insert({
    session_id: sessionId,
    user_id: user.id,
    role: 'assistant',
    content: reply,
  })

  // Met à jour le titre de la session si pas encore défini
  await supabase
    .from('tutor_sessions')
    .update({ titre: content.slice(0, 60), updated_at: new Date().toISOString() })
    .eq('id', sessionId)
    .is('titre', null)

  return NextResponse.json({ reply })
}
