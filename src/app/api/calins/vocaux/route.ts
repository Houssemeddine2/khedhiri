import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const MAX_SIZE = 5 * 1024 * 1024 // 5 Mo

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

  const sc = serviceClient()
  const { data: rows, error } = await sc
    .from('vocaux')
    .select('id, proprietaire_id, titre, vocal_path, duree_sec, created_at')
    .eq('proprietaire_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const vocaux = await Promise.all(
    (rows ?? []).map(async (row) => {
      const { data: signed } = await sc.storage
        .from('calins')
        .createSignedUrl(row.vocal_path, 1800)
      return {
        id: row.id,
        proprietaire_id: row.proprietaire_id,
        titre: row.titre,
        vocal_url: signed?.signedUrl ?? '',
        duree_sec: row.duree_sec,
        created_at: row.created_at,
      }
    })
  )

  return NextResponse.json({ vocaux })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
  }

  const audio = formData.get('audio') as File | null
  const titre = (formData.get('titre') as string | null)?.trim()
  const dureeSec = formData.get('duree_sec')

  if (!audio || !titre) {
    return NextResponse.json({ error: 'Champs manquants : audio et titre requis' }, { status: 400 })
  }
  if (audio.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Fichier trop volumineux (max 5 Mo)' }, { status: 400 })
  }

  const sc = serviceClient()
  const path = `bibliotheque/${user.id}/${crypto.randomUUID()}.webm`
  const bytes = await audio.arrayBuffer()

  const { error: uploadError } = await sc.storage
    .from('calins')
    .upload(path, bytes, { contentType: 'audio/webm', upsert: false })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: row, error: insertError } = await sc
    .from('vocaux')
    .insert({
      proprietaire_id: user.id,
      titre,
      vocal_path: path,
      duree_sec: dureeSec ? Number(dureeSec) : null,
    })
    .select('id')
    .single()

  if (insertError) {
    await sc.storage.from('calins').remove([path])
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ id: row.id }, { status: 201 })
}
