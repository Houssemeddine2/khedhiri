'use server'

import { createClient } from '@/lib/supabase/server'
import { sendNotificationToUsers } from '@/lib/push-server'
import { MEMBRES } from '@/lib/membres'

export async function createTextPost(content: string): Promise<void> {
  if (!content.trim()) return
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { error } = await supabase.from('posts').insert({
    author_id: user.id,
    type: 'text',
    content: content.trim(),
  })
  if (error) throw new Error(error.message)

  const autresIds = MEMBRES.filter(m => m.id !== user.id).map(m => m.id)
  const prenom = user.email!.split('@')[0]
  sendNotificationToUsers(autresIds, {
    title: 'khedhiri.me',
    body: `${prenom} a partagé un message`,
    url: '/',
  }).catch(console.error)
}

export async function uploadMedia(formData: FormData): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const file = formData.get('file') as File | null
  if (!file) throw new Error('Fichier manquant')

  const ext  = file.name.split('.').pop() ?? 'bin'
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage.from('media').upload(path, file)
  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from('media').getPublicUrl(path)
  return data.publicUrl
}

export async function createMediaPost(
  type: 'photo' | 'audio',
  mediaUrl: string,
  audioDuration?: number,
): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { error } = await supabase.from('posts').insert({
    author_id:      user.id,
    type,
    media_url:      mediaUrl,
    audio_duration: audioDuration ?? null,
  })
  if (error) throw new Error(error.message)

  const autresIds = MEMBRES.filter(m => m.id !== user.id).map(m => m.id)
  const prenom = user.email!.split('@')[0]
  const label = type === 'photo' ? 'une photo' : 'un vocal'
  sendNotificationToUsers(autresIds, {
    title: 'khedhiri.me',
    body: `${prenom} a partagé ${label}`,
    url: '/',
  }).catch(console.error)
}

export async function toggleReaction(postId: string, emoji: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data: existing } = await supabase
    .from('reactions')
    .select('id, emoji')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    if (existing.emoji === emoji) {
      const { error } = await supabase.from('reactions').delete().eq('id', existing.id)
      if (error) throw new Error(error.message)
    } else {
      const { error } = await supabase.from('reactions').update({ emoji }).eq('id', existing.id)
      if (error) throw new Error(error.message)
    }
  } else {
    const { error } = await supabase.from('reactions').insert({ post_id: postId, user_id: user.id, emoji })
    if (error) throw new Error(error.message)
  }
}

export async function deletePost(postId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)
    .eq('author_id', user.id)
  if (error) throw new Error(error.message)
}
