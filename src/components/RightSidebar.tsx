import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { MEMBRES } from '@/lib/membres'
import CompteARebours from '@/components/CompteARebours'
import ChatRowTrigger from '@/components/chat/ChatRowTrigger'

const ANNIVERSAIRES: Record<string, { dateNaissance: string; couleur: string }> = {
  'sandra@khedhiri.me': { dateNaissance: '2013-11-14', couleur: 'text-terracotta' },
  'sarah@khedhiri.me':  { dateNaissance: '2017-12-14', couleur: 'text-olive' },
}

export default async function RightSidebar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const isPapa = user.email === 'houssem@khedhiri.me'
  const autresMembres = MEMBRES.filter(m => m.id !== user.id)

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, nom, avatar_url, couleur')
    .in('id', autresMembres.map(m => m.id))

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))

  const SHORTCUTS = [
    { href: '/agenda',   label: 'Agenda',   color: 'bg-azur/10 text-azur' },
    { href: '/defis',    label: 'Défis',    color: 'bg-gold/10 text-gold' },
    { href: '/lettres',  label: 'Lettres',  color: 'bg-terracotta/10 text-terracotta' },
    { href: '/calin',    label: 'Câlins',   color: 'bg-rose/30 text-terracotta-deep' },
    { href: '/lectures', label: 'Lectures', color: 'bg-olive/10 text-olive' },
    { href: '/jeux',     label: 'Jeux',     color: 'bg-gold/10 text-gold' },
  ]

  return (
    <aside className="hidden xl:block w-[280px] flex-shrink-0">
      <div className="sticky top-[72px] space-y-3">

        {/* Section famille */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-fraunces italic text-terracotta text-lg mb-3">La famille</h2>
          <div className="space-y-1">
            {autresMembres.map(membre => {
              const p = profileMap[membre.id]
              return (
                <ChatRowTrigger
                  key={membre.id}
                  userId={membre.id}
                  email={membre.email}
                  nom={p?.nom}
                  avatarUrl={p?.avatar_url}
                  couleur={p?.couleur}
                />
              )
            })}
          </div>
        </div>

        {/* Comptes à rebours — Papa voit les 2, filles voient les leurs */}
        {isPapa ? (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="font-semibold text-ink text-sm mb-3 flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gold" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              Lettres verrouillées
            </h2>
            <div className="space-y-3">
              <CompteARebours nom="Sandra" dateNaissance="2013-11-14" couleur="text-terracotta" />
              <CompteARebours nom="Sarah"  dateNaissance="2017-12-14" couleur="text-olive" />
            </div>
          </div>
        ) : (
          (() => {
            const info = ANNIVERSAIRES[user.email ?? '']
            if (!info) return null
            const prenom = (user.email ?? '').split('@')[0]
            const nom = prenom.charAt(0).toUpperCase() + prenom.slice(1)
            return (
              <div className="bg-white rounded-xl shadow-sm p-4">
                <h2 className="font-semibold text-ink text-sm mb-3 flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gold" aria-hidden="true">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  Ma lettre de Papa
                </h2>
                <CompteARebours nom={nom} dateNaissance={info.dateNaissance} couleur={info.couleur} />
              </div>
            )
          })()
        )}

        {/* Raccourcis */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-semibold text-ink text-sm mb-3">Raccourcis</h2>
          <div className="grid grid-cols-2 gap-2">
            {SHORTCUTS.map(s => (
              <Link
                key={s.href}
                href={s.href}
                className={`flex items-center justify-center py-2 px-3 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 min-h-[44px] ${s.color}`}
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Lien admin (Papa seulement) */}
        {isPapa && (
          <Link
            href="/admin"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-terracotta/10 text-terracotta hover:bg-terracotta/20 transition-colors text-sm font-semibold"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            Tableau de bord Papa
          </Link>
        )}

        <p className="text-xs text-ink-soft/50 text-center px-4">
          khedhiri.me — fait avec ❤️ par Houssem
        </p>
      </div>
    </aside>
  )
}
