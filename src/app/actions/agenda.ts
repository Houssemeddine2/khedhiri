'use server'

import { createClient } from '@/lib/supabase/server'

export async function createEvenement(
  title: string,
  date: string,
  color: string,
  description?: string,
): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { error } = await supabase.from('evenements').insert({
    author_id:   user.id,
    title:       title.trim(),
    date,
    color,
    description: description?.trim() || null,
  })
  if (error) throw new Error(error.message)
}

export async function deleteEvenement(id: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { error } = await supabase
    .from('evenements').delete().eq('id', id).eq('author_id', user.id)
  if (error) throw new Error(error.message)
}

export async function createCompteARebours(
  title: string,
  targetDate: string,
  emoji: string,
): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { error } = await supabase.from('comptes_a_rebours').insert({
    author_id:   user.id,
    title:       title.trim(),
    target_date: targetDate,
    emoji,
  })
  if (error) throw new Error(error.message)
}

export async function deleteCompteARebours(id: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { error } = await supabase
    .from('comptes_a_rebours').delete().eq('id', id).eq('author_id', user.id)
  if (error) throw new Error(error.message)
}
