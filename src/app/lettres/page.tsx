import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NavBar from '@/components/NavBar'
import LettreListePapa from '@/components/lettres/LettreListePapa'
import LettreListeFille from '@/components/lettres/LettreListeFille'
import type { LettrePapa, LettreMetadata } from '@/types/lettre'

const PAPA_ID = 'b6025d5f-77d5-4208-b489-bcc717ebc01c'

export default async function LettresPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  if (user.id === PAPA_ID) {
    const { data } = await supabase
      .from('lettres')
      .select('id, destinataire_id, titre, contenu, unlock_at, notif_envoyee, lue_at, created_at, updated_at')
      .eq('auteur_id', user.id)
      .order('unlock_at', { ascending: true })

    return (
      <>
        <NavBar />
        <main>
          <LettreListePapa lettres={(data ?? []) as LettrePapa[]} />
        </main>
      </>
    )
  }

  // Fille : pas de contenu dans la liste (sécurité : contenu chargé à la demande via API)
  const { data } = await supabase
    .from('lettres')
    .select('id, auteur_id, destinataire_id, titre, unlock_at, lue_at, created_at')
    .eq('destinataire_id', user.id)
    .order('unlock_at', { ascending: true })

  return (
    <>
      <NavBar />
      <main>
        <LettreListeFille lettres={(data ?? []) as LettreMetadata[]} />
      </main>
    </>
  )
}
