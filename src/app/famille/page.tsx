import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NavBar from '@/components/NavBar'
import ArbreGenealogique from '@/components/famille/ArbreGenealogique'
import type { MembreFamille, Anecdote } from '@/types/famille'

const PAPA_EMAIL = 'houssem@khedhiri.me'

export default async function FamillePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [membresRes, anecdotesRes] = await Promise.all([
    supabase
      .from('famille_membres')
      .select('id, prenom, nom, surnom, photo_url, date_naissance, lieu_naissance, cote, relation, generation, bio, created_by, created_at')
      .order('generation', { ascending: true })
      .order('prenom', { ascending: true }),
    supabase
      .from('famille_anecdotes')
      .select('id, membre_id, user_id, contenu, created_at, profiles(email, nom, avatar_url, couleur)')
      .order('created_at', { ascending: true }),
  ])

  if (membresRes.error) console.error('famille_membres:', membresRes.error.message)
  if (anecdotesRes.error) console.error('famille_anecdotes:', anecdotesRes.error.message)

  return (
    <>
      <NavBar />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="font-fraunces text-2xl font-bold text-ink mb-2">
          Notre famille 🌳
        </h1>
        <p className="font-manrope text-ink-soft text-sm mb-6">
          Nos racines des deux côtés de la Méditerranée.
        </p>
        <ArbreGenealogique
          membres={(membresRes.data ?? []) as unknown as MembreFamille[]}
          anecdotes={(anecdotesRes.data ?? []) as unknown as Anecdote[]}
          currentUserId={user.id}
          isPapa={user.email === PAPA_EMAIL}
        />
      </main>
    </>
  )
}
