import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Timeline from '@/components/timeline/Timeline'
import NavBar from '@/components/NavBar'
import type { Post, CurrentUser } from '@/types/post'

export default async function AccueilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Sécurité : redirection si pas d'utilisateur (le middleware gère normalement ce cas)
  if (!user) {
    redirect('/login')
  }

  // Récupération des posts initiaux côté serveur (SSR)
  const { data: initialPosts } = await supabase
    .from('posts')
    .select('*, reactions(*), profiles(email, nom, avatar_url, couleur)')
    .order('created_at', { ascending: false })
    .limit(50)

  // Construction de l'objet utilisateur courant
  const currentUser: CurrentUser = {
    id: user.id,
    email: user.email ?? '',
  }

  // Lecture des variables d'environnement
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return (
    <>
      <NavBar />
      <Timeline
        initialPosts={(initialPosts ?? []) as Post[]}
        currentUser={currentUser}
        supabaseUrl={supabaseUrl}
        supabaseAnonKey={supabaseAnonKey}
      />
    </>
  )
}
