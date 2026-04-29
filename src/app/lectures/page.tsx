import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NavBar from '@/components/NavBar'
import LecturesSection from '@/components/lectures/LecturesSection'

export const metadata = { title: 'Lectures — khedhiri.me' }

export default async function LecturesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-cream pb-32">
        <div className="max-w-lg mx-auto px-4 py-6">
          <h1 className="font-fraunces text-2xl text-ink mb-6">Lectures 📚</h1>
          <LecturesSection userId={user.id} />
        </div>
      </div>
    </>
  )
}
