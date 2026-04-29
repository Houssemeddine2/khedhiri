import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { MEMBRES } from '@/lib/membres'
import AvatarCircle from '@/components/ui/AvatarCircle'
import BottomTabBar from './BottomTabBar'
import ChatTrigger from './chat/ChatTrigger'

export default async function NavBar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const autresMembres = MEMBRES.filter(m => m.id !== user.id)
  const isPapa = user.email === 'houssem@khedhiri.me'

  const allIds = MEMBRES.map(m => m.id)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, nom, avatar_url, couleur')
    .in('id', allIds)

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))
  const ownProfile = profileMap[user.id]

  let lettresBadge = 0
  if (!isPapa) {
    const { count } = await supabase
      .from('lettres')
      .select('id', { count: 'exact', head: true })
      .eq('destinataire_id', user.id)
      .lte('unlock_at', new Date().toISOString())
      .is('lue_at', null)
    lettresBadge = count ?? 0
  }

  const { count: calinsBadgeCount } = await supabase
    .from('calins')
    .select('id', { count: 'exact', head: true })
    .eq('destinataire_id', user.id)
    .is('ecoute_at', null)
  const calinsBadge = calinsBadgeCount ?? 0

  return (
    <>
      {/* ── Header fixe style Facebook ─────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-[0_1px_3px_rgba(42,31,24,0.12)]">
        <div className="h-14 max-w-7xl mx-auto px-3 flex items-center gap-2">

          {/* Logo */}
          <Link
            href="/"
            className="flex-shrink-0 hover:opacity-80 transition-opacity"
            aria-label="khedhiri.me — Accueil"
          >
            <span className="font-fraunces italic text-[22px] leading-none text-terracotta">
              khedhiri
            </span>
          </Link>

          {/* Zone droite */}
          <div className="flex items-center gap-1 ml-auto">
            {/* Avatars des autres membres → panneau chat */}
            {autresMembres.map(membre => {
              const p = profileMap[membre.id]
              return (
                <ChatTrigger
                  key={membre.id}
                  userId={membre.id}
                  email={membre.email}
                  nom={p?.nom}
                  avatarUrl={p?.avatar_url}
                  couleur={p?.couleur}
                />
              )
            })}

            {/* Badge câlins — desktop uniquement (mobile = barre du bas) */}
            <Link
              href="/calin"
              className="relative hidden md:flex w-10 h-10 items-center justify-center rounded-full hover:bg-sand transition-colors"
              aria-label={calinsBadge > 0 ? `${calinsBadge} câlin${calinsBadge > 1 ? 's' : ''} reçu${calinsBadge > 1 ? 's' : ''}` : 'Câlins virtuels'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-terracotta" aria-hidden="true">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              {calinsBadge > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-terracotta-deep text-white text-[9px] font-bold flex items-center justify-center">
                  {calinsBadge}
                </span>
              )}
            </Link>

            {/* Badge lettres — desktop uniquement (mobile = drawer "Plus") */}
            {!isPapa && (
              <Link
                href="/lettres"
                className="relative hidden md:flex w-10 h-10 items-center justify-center rounded-full hover:bg-sand transition-colors"
                aria-label={lettresBadge > 0 ? `${lettresBadge} lettre${lettresBadge > 1 ? 's' : ''} de Papa` : 'Lettres pour mes 18 ans'}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink-soft" aria-hidden="true">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                {lettresBadge > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-terracotta text-white text-[9px] font-bold flex items-center justify-center">
                    {lettresBadge}
                  </span>
                )}
              </Link>
            )}

            {/* Mon profil */}
            <Link
              href="/profil"
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-sand transition-colors"
              aria-label="Mon profil"
            >
              <AvatarCircle
                email={user.email ?? ''}
                nom={ownProfile?.nom}
                avatarUrl={ownProfile?.avatar_url}
                couleur={ownProfile?.couleur}
                size="md"
              />
            </Link>
          </div>
        </div>
      </header>

      {/* Espaceur pour le header fixe */}
      <div className="h-14" aria-hidden="true" />

      {/* Barre de navigation du bas (mobile uniquement) */}
      <BottomTabBar
        isPapa={isPapa}
        lettresBadge={lettresBadge}
        calinsBadge={calinsBadge}
      />
    </>
  )
}
