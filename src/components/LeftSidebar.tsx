import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AvatarCircle from '@/components/ui/AvatarCircle'
import SidebarNav from '@/components/SidebarNav'
import LogoutButton from '@/components/LogoutButton'

const NAV_SECTIONS = [
  {
    label: 'Principal',
    items: [
      { href: '/album',      label: 'Album photos',        icon: 'M3 3h18v18H3V3zm5.5 5.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm13.5 7-5-5-10 10' },
      { href: '/atelier',    label: 'Atelier créatif',     icon: 'M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5zM2 2l7.586 7.586M11 11a2 2 0 1 0 4 0 2 2 0 0 0-4 0' },
      { href: '/agenda',     label: 'Agenda',               icon: 'M3 4h18v18H3V4zm3-2v4m12-4v4M3 10h18' },
      { href: '/decouverte', label: 'Lisbonne & Tunis',    icon: 'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z' },
    ],
  },
  {
    label: 'Apprendre',
    items: [
      { href: '/tuteur',   label: 'Professeur Sid Ahmed', icon: 'M22 10v6M2 10l10-5 10 5-10 5zM6 12v5c3 3 9 3 12 0v-5' },
      { href: '/defis',    label: 'Défis hebdomadaires',  icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
      { href: '/lectures', label: 'Lectures',             icon: 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z' },
      { href: '/jeux',     label: 'Quiz et jeux',         icon: 'M6 2v6l4 4-4 4v6h12v-6l-4-4 4-4V2H6z' },
    ],
  },
  {
    label: 'Famille',
    items: [
      { href: '/famille', label: 'Arbre généalogique',  icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' },
      { href: '/memoire', label: 'Boîte à souvenirs',   icon: 'M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2' },
      { href: '/email',   label: 'Ma boîte mail',       icon: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6' },
      { href: '/lettres', label: 'Lettres pour 18 ans', icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
      { href: '/calin',   label: 'Câlins virtuels',     icon: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z' },
    ],
  },
]

export default async function LeftSidebar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const isPapa = user.email === 'houssem@khedhiri.me'

  const { data: profile } = await supabase
    .from('profiles')
    .select('nom, avatar_url, couleur')
    .eq('id', user.id)
    .single()

  const sections = isPapa
    ? NAV_SECTIONS
    : [
        ...NAV_SECTIONS.slice(0, 2),
        {
          ...NAV_SECTIONS[2],
          items: [
            ...NAV_SECTIONS[2].items,
            { href: '/journal', label: 'Mon journal intime', icon: 'M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z' },
          ],
        },
      ]

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Zone scrollable : profil + navigation */}
      <div className="flex-1 overflow-y-auto min-h-0 px-2 pt-3">
        {/* Carte profil */}
        <Link
          href="/profil"
          className="flex items-center gap-3 p-3 rounded-2xl hover:bg-terracotta/10 transition-colors group mb-2"
        >
          <AvatarCircle
            email={user.email ?? ''}
            nom={profile?.nom}
            avatarUrl={profile?.avatar_url}
            couleur={profile?.couleur}
            size="lg"
          />
          <div className="min-w-0">
            <p className="font-fraunces italic text-[16px] text-ink truncate group-hover:text-terracotta transition-colors leading-tight">
              {profile?.nom ?? user.email?.split('@')[0]}
            </p>
            <p className="text-[11px] text-ink-soft">Voir mon profil</p>
          </div>
        </Link>

        <div className="h-px bg-gradient-to-r from-transparent via-terracotta/20 to-transparent mx-1 mb-1" />

        <SidebarNav sections={sections} isPapa={isPapa} />
      </div>

      {/* Bas épinglé : logout + signature */}
      <div className="flex-shrink-0 px-2 pb-2 pt-1 border-t border-sand/60">
        <LogoutButton />
        <p className="font-caveat text-[13px] text-ink-soft/60 text-center pt-1">
          Avec tout l&apos;amour possible ♡
        </p>
      </div>
    </div>
  )
}
