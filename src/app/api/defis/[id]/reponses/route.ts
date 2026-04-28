import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { membreById } from '@/lib/membres'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']
const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

function photoUrl(path: string | null): string | null {
  if (!path) return null
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/defis/${path}`
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: rows, error } = await supabase
    .from('reponses_defis')
    .select('*')
    .eq('defi_id', id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const reponses = (rows ?? []).map(r => {
    const auteur = membreById(r.auteur_id)
    return {
      id: r.id,
      defi_id: r.defi_id,
      auteur_id: r.auteur_id,
      auteur_nom: auteur?.nom ?? 'Inconnu',
      auteur_email: auteur?.email ?? '',
      contenu: r.contenu,
      photo_url: photoUrl(r.photo_path),
      correct: r.correct,
      created_at: r.created_at,
    }
  })

  return NextResponse.json({ reponses })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: defiId } = await params
  if (!UUID_RE.test(defiId)) return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
  }

  const contenu = (formData.get('contenu') as string | null)?.trim()
  const photo = formData.get('photo') as File | null

  if (!contenu) return NextResponse.json({ error: 'contenu requis' }, { status: 400 })

  const sc = serviceClient()

  const { data: defi, error: defiError } = await sc
    .from('defis')
    .select('id, type, traduction_ar')
    .eq('id', defiId)
    .single()

  if (defiError || !defi) return NextResponse.json({ error: 'Défi introuvable' }, { status: 404 })

  const { data: existing } = await sc
    .from('reponses_defis')
    .select('id')
    .eq('defi_id', defiId)
    .eq('auteur_id', user.id)
    .maybeSingle()

  if (existing) return NextResponse.json({ error: 'Tu as déjà répondu à ce défi' }, { status: 409 })

  let photoPath: string | null = null
  if (photo && photo.size > 0 && defi.type === 'defi') {
    if (!ALLOWED_MIME.includes(photo.type)) {
      return NextResponse.json({ error: 'Format image non supporté (JPEG, PNG, WebP)' }, { status: 400 })
    }
    if (photo.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Image trop volumineuse (max 5 Mo)' }, { status: 400 })
    }
    const ext = EXT[photo.type]
    const uuid = crypto.randomUUID()
    photoPath = `reponses/${defiId}/${uuid}.${ext}`
    const { error: uploadError } = await sc.storage
      .from('defis')
      .upload(photoPath, photo, { contentType: photo.type })
    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  let correct: boolean | null = null
  if (defi.type === 'mot' && defi.traduction_ar) {
    correct = contenu.toLowerCase() === defi.traduction_ar.trim().toLowerCase()
  }

  const { data: inserted, error: insertError } = await sc
    .from('reponses_defis')
    .insert({ defi_id: defiId, auteur_id: user.id, contenu, photo_path: photoPath, correct })
    .select('id')
    .single()

  if (insertError) {
    if (photoPath) await sc.storage.from('defis').remove([photoPath])
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ id: inserted.id, correct }, { status: 201 })
}
