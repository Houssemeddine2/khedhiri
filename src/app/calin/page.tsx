// src/app/calin/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NavBar from '@/components/NavBar'
import CalinPage from '@/components/calins/CalinPage'

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <>
      <NavBar />
      <main className="max-w-lg mx-auto px-4 py-6">
        <h1 className="font-fraunces text-3xl text-ink mb-6">
          Câlins virtuels 🤗
        </h1>
        <CalinPage userId={user.id} />
      </main>
    </>
  )
}
