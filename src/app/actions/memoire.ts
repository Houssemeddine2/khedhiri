'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function uploadFichierSouvenir(formData: FormData, type: 'photo' | 'audio'): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const file = formData.get('file') as File | null
  if (!file) throw new Error('Fichier manquant')

  const ext = file.name.split('.').pop() ?? 'bin'
  const path = `${type}s/${user.id}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('memoires').upload(path, file)
  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from('memoires').getPublicUrl(path)
  return data.publicUrl
}

export async function ajouterSouvenir(params: {
  titre: string
  texte?: string
  photoUrl?: string
  audioUrl?: string
  creationId?: string
  dateSouvenir: string
}): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { error } = await supabase.from('memoires').insert({
    user_id: user.id,
    titre: params.titre.trim(),
    texte: params.texte?.trim() || null,
    photo_url: params.photoUrl ?? null,
    audio_url: params.audioUrl ?? null,
    creation_id: params.creationId ?? null,
    date_souvenir: params.dateSouvenir,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/memoire')
}

export async function supprimerSouvenir(id: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const PAPA_ID = 'b6025d5f-77d5-4208-b489-bcc717ebc01c'
  const query = supabase.from('memoires').delete().eq('id', id)
  const { error } = user.id === PAPA_ID
    ? await query
    : await query.eq('user_id', user.id)
  if (error) throw new Error(error.message)
  revalidatePath('/memoire')
}
