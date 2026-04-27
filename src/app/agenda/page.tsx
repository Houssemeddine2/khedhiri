import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NavBar from '@/components/NavBar'
import AgendaClient from '@/components/agenda/AgendaClient'
import type { Evenement, CompteARebours } from '@/types/agenda'

export default async function AgendaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: evenements }, { data: comptes }] = await Promise.all([
    supabase.from('evenements').select('*').order('date', { ascending: true }),
    supabase.from('comptes_a_rebours').select('*').order('target_date', { ascending: true }),
  ])

  return (
    <>
      <NavBar />
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        <h1 className="font-fraunces text-2xl font-bold text-ink">
          Agenda & Compte à rebours 📅
        </h1>
        <AgendaClient
          initialEvenements={(evenements ?? []) as Evenement[]}
          initialComptes={(comptes ?? []) as CompteARebours[]}
          currentUserId={user.id}
        />
      </main>
    </>
  )
}
