import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NavBar from '@/components/NavBar'
import AtelierPageClient from '@/components/atelier/AtelierPageClient'

export default async function AtelierPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <>
      <NavBar />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="font-fraunces text-2xl font-bold text-ink mb-2">
          Le Coin créatif 🎨
        </h1>
        <p className="font-manrope text-ink-soft text-sm mb-6">
          Dessine, colorie et partage tes créations avec la famille !
        </p>
        <AtelierPageClient userId={user.id} />
      </main>
    </>
  )
}
