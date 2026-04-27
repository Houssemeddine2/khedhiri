'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createJournalProfil(salt: string, checkCipher: string, indice?: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  await supabase.from('journal_profils').insert({
    user_id: user.id,
    salt,
    check_cipher: checkCipher,
    indice: indice ?? null,
  })
  revalidatePath('/journal')
}

export async function createJournalEntree(contenuCipher: string, titreCipher: string | null, date: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  await supabase.from('journal_entrees').insert({
    user_id: user.id,
    contenu_cipher: contenuCipher,
    titre_cipher: titreCipher,
    date,
  })
}

export async function updateJournalEntree(id: string, contenuCipher: string, titreCipher: string | null): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  await supabase
    .from('journal_entrees')
    .update({ contenu_cipher: contenuCipher, titre_cipher: titreCipher, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
}

export async function deleteJournalEntree(id: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  await supabase.from('journal_entrees').delete().eq('id', id).eq('user_id', user.id)
}
