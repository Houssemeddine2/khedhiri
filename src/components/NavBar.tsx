import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { MEMBRES } from '@/lib/membres'
import { avatarFromEmail } from '@/lib/avatar'

export default async function NavBar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const autresMembres = MEMBRES.filter(m => m.id !== user.id)

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

        {/* Chats des autres membres */}
        <div className="flex items-center gap-3 ml-auto">
          {autresMembres.map(membre => {
            const avatar = avatarFromEmail(membre.email)
            return (
              <Link
                key={membre.id}
                href={`/chats/${membre.id}`}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                aria-label={`Chat avec ${avatar.nom}`}
              >
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold font-manrope ${avatar.couleurBg}`}
                  aria-hidden="true"
                >
                  {avatar.initiale}
                </span>
                <span className="text-sm font-manrope text-ink hidden sm:inline">
                  {avatar.nom}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
