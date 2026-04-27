'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const PAPA_ID = 'b6025d5f-77d5-4208-b489-bcc717ebc01c'

export async function uploadPhotoMembre(formData: FormData): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const file = formData.get('file') as File | null
  if (!file) throw new Error('Fichier manquant')

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('famille').upload(path, file)
  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from('famille').getPublicUrl(path)
  return data.publicUrl
}

export async function ajouterMembre(params: {
  prenom: string
  nom?: string
  surnom?: string
  photoUrl?: string
  dateNaissance?: string
  lieuNaissance?: string
  cote: 'khedhiri' | 'maternel'
  relation: string
  generation: number
  bio?: string
}): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { error } = await supabase.from('famille_membres').insert({
    prenom: params.prenom.trim(),
    nom: params.nom?.trim() || null,
    surnom: params.surnom?.trim() || null,
    photo_url: params.photoUrl ?? null,
    date_naissance: params.dateNaissance || null,
    lieu_naissance: params.lieuNaissance?.trim() || null,
    cote: params.cote,
    relation: params.relation.trim(),
    generation: params.generation,
    bio: params.bio?.trim() || null,
    created_by: user.id,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/famille')
}

export async function supprimerMembre(id: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== PAPA_ID) throw new Error('Non autorisé')

  const { error } = await supabase.from('famille_membres').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/famille')
}

export async function ajouterAnecdote(membreId: string, contenu: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { error } = await supabase.from('famille_anecdotes').insert({
    membre_id: membreId,
    user_id: user.id,
    contenu: contenu.trim(),
  })
  if (error) throw new Error(error.message)
  revalidatePath('/famille')
}

export async function supprimerAnecdote(id: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  if (user.id === PAPA_ID) {
    const { error } = await supabase.from('famille_anecdotes').delete().eq('id', id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase.from('famille_anecdotes').delete().eq('id', id).eq('user_id', user.id)
    if (error) throw new Error(error.message)
  }
  revalidatePath('/famille')
}
