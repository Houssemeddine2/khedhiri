'use server'

import { createClient } from '@/lib/supabase/server'

export async function updateProfil(fields: {
  bio?: string
  couleur?: string
  avatar_url?: string
}): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const updates: Record<string, string | null> = {}
  if (fields.bio       !== undefined) updates.bio        = fields.bio.trim() || null
  if (fields.couleur   !== undefined) updates.couleur    = fields.couleur
  if (fields.avatar_url !== undefined) updates.avatar_url = fields.avatar_url

  const { error } = await supabase.from('profiles').update(updates).eq('id', user.id)
  if (error) throw new Error(error.message)
}
