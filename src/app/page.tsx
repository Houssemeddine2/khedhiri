import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Timeline from '@/components/timeline/Timeline'
import NavBar from '@/components/NavBar'
import RightSidebar from '@/components/RightSidebar'
import type { Post, CurrentUser } from '@/types/post'

export default async function AccueilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [postsResult, profileResult] = await Promise.all([
    supabase
      .from('posts')
      .select('*, reactions(*), profiles(email, nom, avatar_url, couleur)')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('profiles')
      .select('nom, avatar_url, couleur')
      .eq('id', user.id)
      .single(),
  ])

  const currentUser: CurrentUser = {
    id: user.id,
    email: user.email ?? '',
  }

  const userProfile = profileResult.data ?? undefined

  return (
    <>
      <NavBar />

      <div className="min-h-screen bg-sand">
        <div className="max-w-7xl mx-auto px-2 md:px-4 pt-4 pb-6">
          <div className="flex gap-4 justify-center">
            {/* Feed central */}
            <main className="flex-1 min-w-0 max-w-[600px] w-full">
              <Timeline
                initialPosts={(postsResult.data ?? []) as Post[]}
                currentUser={currentUser}
                userProfile={userProfile}
                supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL!}
                supabaseAnonKey={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}
              />
            </main>

            {/* Sidebar droite — xl+ */}
            <RightSidebar />
          </div>
        </div>
      </div>
    </>
  )
}
