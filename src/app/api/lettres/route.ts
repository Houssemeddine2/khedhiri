import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { LettrePapa } from '@/types/lettre'

const PAPA_ID = 'b6025d5f-77d5-4208-b489-bcc717ebc01c'
const FILLES_IDS = ['1a0967e9-91e0-48f6-a3da-752255274153', '617eff77-47ed-40e0-b784-c027183c9bee']

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (user.id !== PAPA_ID) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const { data, error } = await supabase
    .from('lettres')
    .select('id, destinataire_id, titre, contenu, unlock_at, notif_envoyee, lue_at, created_at, updated_at')
    .eq('auteur_id', user.id)
    .order('unlock_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ lettres: (data ?? []) as LettrePapa[] })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (user.id !== PAPA_ID) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  let body: { destinataire_id?: unknown; titre?: unknown; contenu?: unknown; unlock_at?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 })
  }

  const { destinataire_id, titre, contenu, unlock_at } = body
  if (
    typeof destinataire_id !== 'string' ||
    typeof titre !== 'string' ||
    typeof contenu !== 'string' ||
    typeof unlock_at !== 'string'
  ) {
    return NextResponse.json({ error: 'Champs manquants ou invalides' }, { status: 400 })
  }
  if (!titre.trim() || !contenu.trim()) {
    return NextResponse.json({ error: 'Titre et contenu requis' }, { status: 400 })
  }
  if (!FILLES_IDS.includes(destinataire_id.trim())) {
    return NextResponse.json({ error: 'Destinataire invalide' }, { status: 400 })
  }
  const unlockDate = new Date(unlock_at)
  if (isNaN(unlockDate.getTime())) {
    return NextResponse.json({ error: 'Format de date invalide' }, { status: 400 })
  }
  if (unlockDate <= new Date()) {
    return NextResponse.json({ error: 'La date de déverrouillage doit être dans le futur' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('lettres')
    .insert({
      auteur_id: user.id,
      destinataire_id: destinataire_id.trim(),
      titre: titre.trim(),
      contenu: contenu.trim(),
      unlock_at: unlockDate.toISOString(),
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id }, { status: 201 })
}
