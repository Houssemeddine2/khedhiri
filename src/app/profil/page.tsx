import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NavBar from '@/components/NavBar'
import ProfilClient from '@/components/profil/ProfilClient'

export default async function ProfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('nom, bio, couleur, avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <>
      <NavBar />
      <main className="max-w-lg mx-auto px-4 py-8">
        <h1 className="font-fraunces text-2xl font-bold text-ink mb-8 text-center">
          Mon profil
        </h1>
        <ProfilClient
          userId={user.id}
          email={user.email ?? ''}
          nom={profile?.nom ?? ''}
          bio={profile?.bio ?? null}
          couleur={profile?.couleur ?? null}
          avatarUrl={profile?.avatar_url ?? null}
        />
      </main>
    </>
  )
}
