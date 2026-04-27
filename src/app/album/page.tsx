import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NavBar from '@/components/NavBar'
import PhotoGrid from '@/components/album/PhotoGrid'

export default async function AlbumPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: photos } = await supabase
    .from('posts')
    .select('id, author_id, media_url, created_at, profiles(email, nom, avatar_url, couleur)')
    .eq('type', 'photo')
    .order('created_at', { ascending: false })

  return (
    <>
      <NavBar />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="font-fraunces text-2xl font-bold text-ink mb-6">
          Notre Album 📷
        </h1>
        <PhotoGrid
          photos={(photos ?? []) as unknown as Parameters<typeof PhotoGrid>[0]['photos']}
          currentUserId={user.id}
        />
      </main>
    </>
  )
}
