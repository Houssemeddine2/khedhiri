import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const PAPA_ID = 'b6025d5f-77d5-4208-b489-bcc717ebc01c'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: lettre, error } = await supabase
    .from('lettres')
    .select('id, auteur_id, destinataire_id, titre, contenu, unlock_at, lue_at, created_at')
    .eq('id', id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!lettre) return NextResponse.json({ error: 'Lettre non trouvée' }, { status: 404 })
  if (lettre.destinataire_id !== user.id && lettre.auteur_id !== user.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const decouverte = new Date(lettre.unlock_at) <= new Date()

  if (!decouverte) {
    const { contenu: _c, ...metadata } = lettre
    return NextResponse.json({ lettre: metadata, decouverte: false })
  }

  // Marquer comme lue au premier accès de la fille (service role pour bypasser RLS)
  if (lettre.destinataire_id === user.id && !lettre.lue_at) {
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    await serviceClient
      .from('lettres')
      .update({ lue_at: new Date().toISOString() })
      .eq('id', id)
      .is('lue_at', null)
    lettre.lue_at = new Date().toISOString()
  }

  return NextResponse.json({ lettre, decouverte: true })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (user.id !== PAPA_ID) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 })
  }

  if ('unlock_at' in body) {
    return NextResponse.json({ error: 'La date de déverrouillage ne peut pas être modifiée' }, { status: 400 })
  }

  const updates: { titre?: string; contenu?: string; updated_at: string } = {
    updated_at: new Date().toISOString(),
  }
  if (typeof body.titre === 'string' && body.titre.trim()) updates.titre = body.titre.trim()
  if (typeof body.contenu === 'string' && body.contenu.trim()) updates.contenu = body.contenu.trim()

  if (!updates.titre && !updates.contenu) {
    return NextResponse.json({ error: 'Aucun champ modifiable fourni' }, { status: 400 })
  }

  const { data: updated, error } = await supabase
    .from('lettres')
    .update(updates)
    .eq('id', id)
    .eq('auteur_id', user.id)
    .select('id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!updated || updated.length === 0) return NextResponse.json({ error: 'Lettre non trouvée' }, { status: 404 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (user.id !== PAPA_ID) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const { data: deleted, error } = await supabase
    .from('lettres')
    .delete()
    .eq('id', id)
    .eq('auteur_id', user.id)
    .select('id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!deleted || deleted.length === 0) return NextResponse.json({ error: 'Lettre non trouvée' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
