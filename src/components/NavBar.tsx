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
      <div className="max-w-lg mx-auto px-4 py-2 flex items-center gap-4">
        {/* Lien timeline */}
        <Link
          href="/"
          className="flex items-center gap-1 text-ink-soft hover:text-terracotta transition-colors"
          aria-label="Retour à la timeline familiale"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span className="text-sm font-manrope hidden sm:inline">Timeline</span>
        </Link>

        {/* Liens vers les chats des 2 autres membres */}
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
