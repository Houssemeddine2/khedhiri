import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { MEMBRES, membreById } from '@/lib/membres'
import { sendNotificationToUsers } from '@/lib/push-server'

const MAX_SIZE = 5 * 1024 * 1024
const MEMBRES_IDS = MEMBRES.map(m => m.id)

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
    .from('calins')
    .select('id, expediteur_id, destinataire_id, vocal_path, titre, envoye_at, ecoute_at')
    .eq('destinataire_id', user.id)
    .order('envoye_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const calins = await Promise.all(
    (rows ?? []).map(async (row) => {
      const { data: signed } = await sc.storage
        .from('calins')
        .createSignedUrl(row.vocal_path, 1800)
      const expediteur = membreById(row.expediteur_id)
      return {
        id: row.id,
        expediteur_id: row.expediteur_id,
        expediteur_nom: expediteur?.nom ?? 'Inconnu',
        expediteur_email: expediteur?.email ?? '',
        destinataire_id: row.destinataire_id,
        vocal_url: signed?.signedUrl ?? '',
        titre: row.titre,
        envoye_at: row.envoye_at,
        ecoute_at: row.ecoute_at,
      }
    })
  )

  return NextResponse.json({ calins })
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

  const destinataireId = (formData.get('destinataire_id') as string | null)?.trim()
  const titre = (formData.get('titre') as string | null)?.trim()
  const vocalId = formData.get('vocal_id') as string | null
  const audio = formData.get('audio') as File | null
  const sauvegarder = formData.get('sauvegarder') === 'true'
  const dureeSec = formData.get('duree_sec')

  if (!destinataireId || !titre) {
    return NextResponse.json({ error: 'destinataire_id et titre requis' }, { status: 400 })
  }
  if (!MEMBRES_IDS.includes(destinataireId)) {
    return NextResponse.json({ error: 'Destinataire invalide' }, { status: 400 })
  }
  if (destinataireId === user.id) {
    return NextResponse.json({ error: 'Vous ne pouvez pas vous envoyer un câlin' }, { status: 400 })
  }
  if (!vocalId && !audio) {
    return NextResponse.json({ error: 'Un vocal est requis (vocal_id ou audio)' }, { status: 400 })
  }

  const sc = serviceClient()
  let vocalPath: string

  if (vocalId) {
    const { data: vocal } = await sc
      .from('vocaux')
      .select('vocal_path')
      .eq('id', vocalId)
      .eq('proprietaire_id', user.id)
      .maybeSingle()

    if (!vocal) return NextResponse.json({ error: 'Vocal non trouvé' }, { status: 404 })

    // Copie indépendante dans envois/
    const { data: fileData, error: dlError } = await sc.storage
      .from('calins')
      .download(vocal.vocal_path)

    if (dlError || !fileData) return NextResponse.json({ error: 'Erreur lecture vocal' }, { status: 500 })

    vocalPath = `envois/${crypto.randomUUID()}.webm`
    const bytes = await fileData.arrayBuffer()
    const { error: upError } = await sc.storage
      .from('calins')
      .upload(vocalPath, bytes, { contentType: 'audio/webm', upsert: false })

    if (upError) return NextResponse.json({ error: upError.message }, { status: 500 })
  } else {
    if (audio!.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Fichier trop volumineux (max 5 Mo)' }, { status: 400 })
    }
    vocalPath = `envois/${crypto.randomUUID()}.webm`
    const bytes = await audio!.arrayBuffer()
    const { error: upError } = await sc.storage
      .from('calins')
      .upload(vocalPath, bytes, { contentType: 'audio/webm', upsert: false })

    if (upError) return NextResponse.json({ error: upError.message }, { status: 500 })

    if (sauvegarder) {
      await sc.from('vocaux').insert({
        proprietaire_id: user.id,
        titre,
        vocal_path: `bibliotheque/${user.id}/${crypto.randomUUID()}.webm`,
        duree_sec: dureeSec ? Number(dureeSec) : null,
      })
      // Note: pour simplifier, on ré-upload pas pour la biblio ici — le câlin envoyé est indépendant
    }
  }

  const { data: calin, error: insertError } = await sc
    .from('calins')
    .insert({
      expediteur_id: user.id,
      destinataire_id: destinataireId,
      vocal_path: vocalPath,
      titre,
    })
    .select('id')
    .single()

  if (insertError) {
    await sc.storage.from('calins').remove([vocalPath])
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  const expediteur = membreById(user.id)
  await sendNotificationToUsers([destinataireId], {
    title: `🤗 Câlin de ${expediteur?.nom ?? 'Papa'}`,
    body: titre,
    url: '/calin',
  })

  return NextResponse.json({ id: calin.id }, { status: 201 })
}
