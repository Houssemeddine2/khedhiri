// src/app/api/pronote/sync/route.ts
// Les tables pronote_* ne sont pas encore dans les types générés Supabase.
// On utilise un client non-typé (any) jusqu'à la prochaine régénération des types.
import { NextResponse } from 'next/server'
import { createClient as createAdminClient, type SupabaseClient } from '@supabase/supabase-js'
import { fetchPronoteDonnees } from '@/lib/pronote/client'

export const maxDuration = 60

const PAPA_EMAIL = 'houssem@khedhiri.me'
const FILLES_IDS = [
  '1a0967e9-91e0-48f6-a3da-752255274153', // Sandra
  '617eff77-47ed-40e0-b784-c027183c9bee', // Sarah
]

async function decrypt(encrypted: string): Promise<string> {
  const { subtle } = await import('crypto')
  const keyRaw = Buffer.from(process.env.PRONOTE_ENCRYPTION_KEY!, 'hex')
  const key = await subtle.importKey('raw', keyRaw, 'AES-GCM', false, ['decrypt'])
  const combined = Buffer.from(encrypted, 'base64')
  const iv = combined.subarray(0, 12)
  const cipher = combined.subarray(12)
  const plain = await subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher)
  return new TextDecoder().decode(plain)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdminClient = SupabaseClient<any, any, any>

async function syncFille(
  admin: AdminClient,
  userId: string,
): Promise<{ synced?: boolean; skipped?: boolean; reason?: string; counts?: object; error?: string }> {
  const { data: profile } = await admin
    .from('profiles')
    .select('pronote_url, pronote_username, pronote_password_encrypted')
    .eq('id', userId)
    .single() as { data: { pronote_url: string | null; pronote_username: string | null; pronote_password_encrypted: string | null } | null }

  if (!profile?.pronote_url || !profile.pronote_username || !profile.pronote_password_encrypted) {
    return { skipped: true, reason: 'credentials manquants' }
  }

  const password = await decrypt(profile.pronote_password_encrypted)
  const donnees = await fetchPronoteDonnees(profile.pronote_url, profile.pronote_username, password)

  // Remplace toutes les données existantes
  await Promise.all([
    admin.from('pronote_notes').delete().eq('user_id', userId),
    admin.from('pronote_devoirs').delete().eq('user_id', userId),
    admin.from('pronote_absences').delete().eq('user_id', userId),
    admin.from('pronote_observations').delete().eq('user_id', userId),
    admin.from('pronote_evenements').delete().eq('user_id', userId),
  ])

  await Promise.all([
    donnees.notes.length && admin.from('pronote_notes').insert(
      donnees.notes.map(n => ({
        user_id: userId,
        matiere: n.matiere,
        note: n.note,
        note_max: n.noteMax,
        date: n.date.split('T')[0],
        commentaire: n.commentaire ?? null,
      }))
    ),
    donnees.devoirs.length && admin.from('pronote_devoirs').insert(
      donnees.devoirs.map(d => ({
        user_id: userId,
        matiere: d.matiere,
        description: d.description,
        date_rendu: d.dateRendu.split('T')[0],
        fait: d.fait,
      }))
    ),
    donnees.absences.length && admin.from('pronote_absences').insert(
      donnees.absences.map(a => ({
        user_id: userId,
        date_debut: a.dateDebut,
        date_fin: a.dateFin,
        justifiee: a.justifiee,
        cours: a.cours ?? null,
      }))
    ),
    donnees.observations.length && admin.from('pronote_observations').insert(
      donnees.observations.map(o => ({
        user_id: userId,
        prof: o.prof ?? null,
        matiere: o.matiere ?? null,
        contenu: o.contenu,
        date: o.date.split('T')[0],
      }))
    ),
    donnees.evenements.length && admin.from('pronote_evenements').insert(
      donnees.evenements.map(e => ({
        user_id: userId,
        titre: e.titre,
        type: e.type,
        date_debut: e.dateDebut,
        date_fin: e.dateFin ?? null,
      }))
    ),
  ])

  return {
    synced: true,
    counts: {
      notes: donnees.notes.length,
      devoirs: donnees.devoirs.length,
      absences: donnees.absences.length,
      observations: donnees.observations.length,
      evenements: donnees.evenements.length,
    },
  }
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`

  if (!isCron) {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.email !== PAPA_EMAIL) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  ) as AdminClient

  const results = await Promise.allSettled(
    FILLES_IDS.map(id => syncFille(admin, id))
  )

  return NextResponse.json({
    ok: true,
    results: results.map((r, i) => ({
      userId: FILLES_IDS[i],
      ...(r.status === 'fulfilled' ? r.value : { error: String(r.reason) }),
    })),
  })
}
