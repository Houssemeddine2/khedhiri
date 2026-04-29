import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NavBar from '@/components/NavBar'
import MurSouvenirs from '@/components/memoire/MurSouvenirs'
import type { Souvenir } from '@/types/memoire'
import type { Creation } from '@/types/creation'

const PAPA_EMAIL = 'houssem@khedhiri.me'

export default async function MemoirePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [souvenirRes, creationsRes] = await Promise.all([
    supabase
      .from('memoires')
      .select('id, user_id, titre, texte, photo_url, audio_url, creation_id, date_souvenir, created_at, profiles(email, nom, avatar_url, couleur), creations(media_url, title)')
      .order('date_souvenir', { ascending: false }),
    supabase
      .from('creations')
      .select('id, author_id, title, media_url, created_at')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  // Attacher manuellement le profil de l'auteur (pas de FK déclarée dans Supabase)
  const { data: ownProfile } = await supabase
    .from('profiles')
    .select('id, email, nom, avatar_url, couleur')
    .eq('id', user.id)
    .single()
  const creationsWithProfile = (creationsRes.data ?? []).map(c => ({
    ...c,
    profiles: ownProfile ?? null,
  }))

  return (
    <>
      <NavBar />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="font-fraunces text-2xl font-bold text-ink mb-2">
          Boîte à souvenirs 📦
        </h1>
        <p className="font-manrope text-ink-soft text-sm mb-6">
          Les moments précieux de notre famille, pour toujours.
        </p>
        <MurSouvenirs
          souvenirs={(souvenirRes.data ?? []) as unknown as Souvenir[]}
          creations={creationsWithProfile as unknown as Creation[]}
          currentUserId={user.id}
          isPapa={user.email === PAPA_EMAIL}
        />
      </main>
    </>
  )
}
