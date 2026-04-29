import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Profile = { id: string; email: string; nom: string; avatar_url?: string | null; couleur?: string | null }

async function fetchProfilesMap(supabase: Awaited<ReturnType<typeof createClient>>, authorIds: string[]): Promise<Record<string, Profile>> {
  if (authorIds.length === 0) return {}
  const { data } = await supabase
    .from('profiles')
    .select('id, email, nom, avatar_url, couleur')
    .in('id', authorIds)
  const map: Record<string, Profile> = {}
  for (const p of data ?? []) map[p.id] = p
  return map
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: creations, error } = await supabase
    .from('creations')
    .select('*, reactions_creations(*)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const authorIds = [...new Set((creations ?? []).map((c: { author_id: string }) => c.author_id))]
  const profilesMap = await fetchProfilesMap(supabase, authorIds)

  const result = (creations ?? []).map((c: { author_id: string; [key: string]: unknown }) => ({
    ...c,
    profiles: profilesMap[c.author_id] ?? null,
  }))

  return NextResponse.json(result)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })

  const MAX_BYTES = 10 * 1024 * 1024
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Fichier trop volumineux (max 10 Mo)' }, { status: 413 })
  }

  const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp'])
  const rawExt = (file.name.split('.').pop() ?? '').toLowerCase()
  const ext = ALLOWED_EXT.has(rawExt) ? rawExt : 'jpg'

  const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
  const safeContentType = ALLOWED_MIME.has(file.type) ? file.type : 'image/jpeg'

  // Même format de chemin que uploadMedia (posts.ts) pour que la RLS storage fonctionne
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`
  const { error: uploadError } = await supabase.storage
    .from('media')
    .upload(path, file, { contentType: safeContentType })
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path)

  const { data: creation, error: insertError } = await supabase
    .from('creations')
    .insert({ author_id: user.id, media_url: publicUrl, source: 'upload', title: null })
    .select('*, reactions_creations(*)')
    .single()

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  const profilesMap = await fetchProfilesMap(supabase, [user.id])
  return NextResponse.json({ ...creation, profiles: profilesMap[user.id] ?? null }, { status: 201 })
}
