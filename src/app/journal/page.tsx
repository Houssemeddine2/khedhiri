import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NavBar from '@/components/NavBar'
import JournalClient from '@/components/journal/JournalClient'
import { avatarFromEmail } from '@/lib/avatar'
import type { JournalProfil, JournalEntree } from '@/types/journal'

export default async function JournalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Papa n'a pas de journal — le journal est réservé aux filles
  const emailPapa = 'houssem@khedhiri.me'
  if (user.email === emailPapa) {
    return (
      <>
        <NavBar />
        <main className="max-w-lg mx-auto px-4 py-12 text-center space-y-4">
          <p className="text-5xl">🔒</p>
          <h1 className="font-fraunces text-xl font-bold text-ink">
            Les journaux intimes sont privés
          </h1>
          <p className="font-manrope text-ink-soft text-sm">
            Les journaux de Sandra et Sarah sont chiffrés. Même toi tu ne peux pas les lire — c&apos;est ce qui les rend vrais.
          </p>
        </main>
      </>
    )
  }

  const prenom = avatarFromEmail(user.email ?? '').nom

  const [{ data: profil }, { data: entrees }] = await Promise.all([
    supabase
      .from('journal_profils')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('journal_entrees')
      .select('id, user_id, titre_cipher, contenu_cipher, date, created_at, updated_at')
      .eq('user_id', user.id)
      .order('date', { ascending: false }),
  ])

  return (
    <>
      <NavBar />
      <main className="max-w-lg mx-auto px-4 py-6">
        <JournalClient
          prenom={prenom}
          profil={profil as JournalProfil | null}
          entreesChiffrees={(entrees ?? []) as JournalEntree[]}
        />
      </main>
    </>
  )
}
