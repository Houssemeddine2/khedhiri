'use server'

import { createClient } from '@/lib/supabase/server'

export async function saveCreation(mediaUrl: string, title?: string, source: 'digital' | 'upload' = 'digital'): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { error } = await supabase.from('creations').insert({
    author_id: user.id,
    media_url: mediaUrl,
    title:     title?.trim() || null,
    source,
  })
  if (error) throw new Error(error.message)
}

export async function deleteCreation(creationId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { error } = await supabase
    .from('creations')
    .delete()
    .eq('id', creationId)
    .eq('author_id', user.id)
  if (error) throw new Error(error.message)
}
