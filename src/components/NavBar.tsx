import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { MEMBRES } from '@/lib/membres'
import { avatarFromEmail } from '@/lib/avatar'
import AvatarCircle from '@/components/ui/AvatarCircle'

export default async function NavBar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const autresMembres = MEMBRES.filter(m => m.id !== user.id)
  const isPapa = user.email === 'houssem@khedhiri.me'

  // Fetch profiles for all members (own + others for chat avatars)
  const allIds = MEMBRES.map(m => m.id)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, nom, avatar_url, couleur')
    .in('id', allIds)

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))
  const ownProfile = profileMap[user.id]

  // Badge lettres : lettres déverrouillées non lues (filles uniquement)
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

  return (
    <nav className="sticky top-0 z-50 bg-cream border-b border-terracotta/20 shadow-sm">
      <div className="max-w-lg mx-auto px-4 py-2 flex items-center gap-3">
        {/* Timeline */}
        <Link
          href="/"
          className="flex items-center gap-1 text-ink-soft hover:text-terracotta transition-colors"
          aria-label="Timeline familiale"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span className="text-xs font-manrope hidden sm:inline">Accueil</span>
        </Link>

        {/* Album */}
        <Link
          href="/album"
          className="flex items-center gap-1 text-ink-soft hover:text-terracotta transition-colors"
          aria-label="Album photos"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <span className="text-xs font-manrope hidden sm:inline">Album</span>
        </Link>

        {/* Atelier créatif */}
        <Link
          href="/atelier"
          className="flex items-center gap-1 text-ink-soft hover:text-terracotta transition-colors"
          aria-label="Coin créatif"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 19l7-7 3 3-7 7-3-3z"/>
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
            <path d="M2 2l7.586 7.586"/>
            <circle cx="11" cy="11" r="2"/>
          </svg>
          <span className="text-xs font-manrope hidden sm:inline">Atelier</span>
        </Link>

        {/* Agenda */}
        <Link
          href="/agenda"
          className="flex items-center gap-1 text-ink-soft hover:text-terracotta transition-colors"
          aria-label="Agenda"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span className="text-xs font-manrope hidden sm:inline">Agenda</span>
        </Link>

        {/* Découverte */}
        <Link
          href="/decouverte"
          className="flex items-center gap-1 text-ink-soft hover:text-terracotta transition-colors"
          aria-label="Découverte Lisbonne et Tunis"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
          <span className="text-xs font-manrope hidden sm:inline">Villes</span>
        </Link>

        {/* Tuteur IA */}
        <Link
          href="/tuteur"
          className="flex items-center gap-1 text-ink-soft hover:text-terracotta transition-colors"
          aria-label={isPapa ? 'Historique Sid Ahmed' : 'Mon tuteur Sid Ahmed'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
            <path d="M6 12v5c3 3 9 3 12 0v-5"/>
          </svg>
          <span className="text-xs font-manrope hidden sm:inline">{isPapa ? 'Sid Ahmed' : 'Tuteur'}</span>
        </Link>

        {/* Souvenirs */}
        <Link
          href="/memoire"
          className="flex items-center gap-1 text-ink-soft hover:text-terracotta transition-colors"
          aria-label="Boîte à souvenirs"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
          </svg>
          <span className="text-xs font-manrope hidden sm:inline">Souvenirs</span>
        </Link>

        {/* Famille */}
        <Link
          href="/famille"
          className="flex items-center gap-1 text-ink-soft hover:text-terracotta transition-colors"
          aria-label="Arbre généalogique"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <span className="text-xs font-manrope hidden sm:inline">Famille</span>
        </Link>

        {/* Email */}
        <Link
          href="/email"
          className="flex items-center gap-1 text-ink-soft hover:text-terracotta transition-colors"
          aria-label="Ma boîte mail"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
          <span className="text-xs font-manrope hidden sm:inline">Email</span>
        </Link>

        {/* Lettres */}
        <Link
          href="/lettres"
          className="relative flex items-center gap-1 text-ink-soft hover:text-terracotta transition-colors"
          aria-label={isPapa ? 'Mes lettres' : 'Lettres de Papa'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          {!isPapa && lettresBadge > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-terracotta text-white text-[9px] font-bold flex items-center justify-center">
              {lettresBadge}
            </span>
          )}
          <span className="text-xs font-manrope hidden sm:inline">Lettres</span>
        </Link>

        {/* Journal intime — filles uniquement */}
        {!isPapa && (
          <Link
            href="/journal"
            className="flex items-center gap-1 text-ink-soft hover:text-terracotta transition-colors"
            aria-label="Mon journal intime"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
            <span className="text-xs font-manrope hidden sm:inline">Journal</span>
          </Link>
        )}

        {/* Chats des autres membres + Mon profil */}
        <div className="flex items-center gap-3 ml-auto">
          {autresMembres.map(membre => {
            const p = profileMap[membre.id]
            const av = avatarFromEmail(membre.email)
            return (
              <Link
                key={membre.id}
                href={`/chats/${membre.id}`}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                aria-label={`Chat avec ${p?.nom ?? av.nom}`}
              >
                <AvatarCircle
                  email={membre.email}
                  nom={p?.nom}
                  avatarUrl={p?.avatar_url}
                  couleur={p?.couleur}
                  size="sm"
                />
                <span className="text-sm font-manrope text-ink hidden sm:inline">
                  {p?.nom ?? av.nom}
                </span>
              </Link>
            )
          })}

          {/* Mon profil */}
          <Link
            href="/profil"
            aria-label="Mon profil"
            className="hover:opacity-80 transition-opacity"
          >
            <AvatarCircle
              email={user.email ?? ''}
              nom={ownProfile?.nom}
              avatarUrl={ownProfile?.avatar_url}
              couleur={ownProfile?.couleur}
              size="sm"
            />
          </Link>
        </div>
      </div>
    </nav>
  )
}
