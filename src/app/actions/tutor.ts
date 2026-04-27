'use server'

import { createClient } from '@/lib/supabase/server'

export async function createTutorSession(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data, error } = await supabase
    .from('tutor_sessions')
    .insert({ user_id: user.id })
    .select('id')
    .single()

  if (error || !data) throw new Error('Impossible de créer la session')
  return data.id
}

export async function deleteTutorSession(id: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  await supabase.from('tutor_sessions').delete().eq('id', id).eq('user_id', user.id)
}
