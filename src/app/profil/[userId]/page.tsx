import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NavBar from '@/components/NavBar'
import AvatarCircle from '@/components/ui/AvatarCircle'
import Link from 'next/link'

interface Props {
  params: Promise<{ userId: string }>
}

export default async function ProfilMembrePage({ params }: Props) {
  const { userId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Rediriger vers son propre profil si on essaie de voir le sien
  if (userId === user.id) redirect('/profil')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, nom, bio, couleur, avatar_url, email')
    .eq('id', userId)
    .single()

  if (!profile) notFound()

  return (
    <>
      <NavBar />
      <main className="max-w-lg mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-4">
          <AvatarCircle
            email={profile.email}
            nom={profile.nom}
            avatarUrl={profile.avatar_url}
            couleur={profile.couleur}
            size="2xl"
          />
          <h1 className="font-fraunces text-2xl font-bold text-ink">{profile.nom}</h1>
          {profile.bio && (
            <p className="font-manrope text-ink-soft text-center text-sm max-w-xs">{profile.bio}</p>
          )}
          <Link
            href={`/chats/${userId}`}
            className="mt-4 bg-terracotta text-white font-manrope font-semibold px-6 py-3 rounded-xl hover:bg-terracotta-deep transition-colors"
          >
            Envoyer un message
          </Link>
        </div>
      </main>
    </>
  )
}
