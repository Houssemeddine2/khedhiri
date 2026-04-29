import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { MEMBRES } from '@/lib/membres'
import NavBar from '@/components/NavBar'
import AvatarCircle from '@/components/ui/AvatarCircle'
import CompteARebours from '@/components/CompteARebours'
import ChangerMotDePasse from '@/components/admin/ChangerMotDePasse'

export const metadata = { title: 'Tableau de bord — Papa' }

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== 'houssem@khedhiri.me') redirect('/')

  const filles = MEMBRES.filter(m => m.email !== 'houssem@khedhiri.me')
  const fillesIds = filles.map(f => f.id)

  const [
    profilesResult,
    postsResult,
    lettresResult,
    tuteurResult,
  ] = await Promise.all([
    supabase.from('profiles').select('id, email, nom, avatar_url, couleur').in('id', [...fillesIds, user.id]),
    supabase.from('posts').select('id, author_id, created_at').order('created_at', { ascending: false }).limit(100),
    supabase.from('lettres').select('id, destinataire_id, titre, unlock_at, lue_at'),
    supabase.from('tutor_sessions').select('id, user_id, created_at').order('created_at', { ascending: false }).limit(50),
  ])

  const profileMap = Object.fromEntries((profilesResult.data ?? []).map(p => [p.id, p]))
  const posts = postsResult.data ?? []
  const lettres = lettresResult.data ?? []
  const sessions = tuteurResult.data ?? []

  const stats = {
    totalPosts: posts.length,
    lettresSandra: lettres.filter(l => l.destinataire_id === filles[0]?.id).length,
    lettresSarah: lettres.filter(l => l.destinataire_id === filles[1]?.id).length,
    sessionsSandra: sessions.filter(s => s.user_id === filles[0]?.id).length,
    sessionsSarah: sessions.filter(s => s.user_id === filles[1]?.id).length,
  }

  const fillesData = [
    {
      membre: filles[0],
      profile: profileMap[filles[0]?.id ?? ''],
      dateNaissance: '2013-11-14',
      lettres: stats.lettresSandra,
      sessions: stats.sessionsSandra,
      couleur: 'text-terracotta',
      bgCouleur: 'bg-terracotta/10 border-terracotta/20',
    },
    {
      membre: filles[1],
      profile: profileMap[filles[1]?.id ?? ''],
      dateNaissance: '2017-12-14',
      lettres: stats.lettresSarah,
      sessions: stats.sessionsSarah,
      couleur: 'text-olive',
      bgCouleur: 'bg-olive/10 border-olive/20',
    },
  ]

  const ownProfile = profileMap[user.id]

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-sand">
        <div className="max-w-4xl mx-auto px-4 pt-6 pb-24 md:pb-8">

          {/* En-tête */}
          <div className="flex items-center gap-4 mb-8">
            <AvatarCircle
              email={user.email ?? ''}
              nom={ownProfile?.nom}
              avatarUrl={ownProfile?.avatar_url}
              couleur={ownProfile?.couleur}
              size="xl"
            />
            <div>
              <h1 className="font-fraunces italic text-3xl text-terracotta">
                Bonjour, Houssem ♡
              </h1>
              <p className="text-ink-soft font-manrope">Tableau de bord — ta famille au complet</p>
            </div>
          </div>

          {/* Stat globale */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { label: 'Messages partagés', value: stats.totalPosts, icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
              { label: 'Lettres écrites', value: stats.lettresSandra + stats.lettresSarah, icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
              { label: 'Sessions tuteur', value: stats.sessionsSandra + stats.sessionsSarah, icon: 'M22 10v6M2 10l10-5 10 5-10 5z' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl shadow-sm p-4 text-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-terracotta mx-auto mb-2" aria-hidden="true">
                  <path d={s.icon} />
                </svg>
                <p className="text-3xl font-bold font-fraunces text-ink">{s.value}</p>
                <p className="text-xs text-ink-soft mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Cartes filles */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {fillesData.map(({ membre, profile, dateNaissance, lettres: nbLettres, sessions: nbSessions, couleur, bgCouleur }) => {
              if (!membre) return null
              const nom = profile?.nom ?? membre.nom
              return (
                <div key={membre.id} className={`bg-white rounded-2xl shadow-sm border ${bgCouleur} p-5`}>
                  <div className="flex items-center gap-3 mb-4">
                    <AvatarCircle
                      email={membre.email}
                      nom={profile?.nom}
                      avatarUrl={profile?.avatar_url}
                      couleur={profile?.couleur}
                      size="xl"
                    />
                    <div>
                      <h2 className={`font-fraunces italic text-2xl ${couleur}`}>{nom}</h2>
                      <p className="text-xs text-ink-soft">{membre.email}</p>
                    </div>
                  </div>

                  {/* Mini stats */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {[
                      { label: 'Lettres écrites', value: nbLettres },
                      { label: 'Sessions tuteur', value: nbSessions },
                    ].map(s => (
                      <div key={s.label} className="bg-sand/50 rounded-xl p-3 text-center">
                        <p className={`text-2xl font-bold font-fraunces ${couleur}`}>{s.value}</p>
                        <p className="text-[11px] text-ink-soft">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Compte à rebours 18 ans */}
                  <CompteARebours nom={nom} dateNaissance={dateNaissance} couleur={couleur} />

                  {/* Actions rapides */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Link
                      href={`/chats/${membre.id}`}
                      className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-sm font-semibold transition-colors min-h-[44px] ${bgCouleur} hover:opacity-80`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      </svg>
                      Message
                    </Link>
                    <Link
                      href="/tuteur"
                      className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-sand text-ink-soft hover:bg-sand-warm text-sm font-semibold transition-colors min-h-[44px]"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                      </svg>
                      Tuteur
                    </Link>
                    <Link
                      href="/lettres"
                      className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-sand text-ink-soft hover:bg-sand-warm text-sm font-semibold transition-colors min-h-[44px]"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      </svg>
                      Lettres
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Changer les mots de passe */}
          <div className="mb-8">
            <ChangerMotDePasse />
          </div>

          {/* Actions rapides Papa */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="font-fraunces italic text-terracotta text-xl mb-4">Actions rapides</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { href: '/lettres',    label: 'Écrire une lettre',      icon: '✍️' },
                { href: '/defis',      label: 'Créer un défi',          icon: '⭐' },
                { href: '/calin',      label: 'Envoyer un câlin',       icon: '🤗' },
                { href: '/tuteur',     label: 'Voir les sessions',       icon: '📚' },
                { href: '/album',      label: 'Ajouter une photo',      icon: '📸' },
                { href: '/profil',     label: 'Mon profil',             icon: '👤' },
              ].map(a => (
                <Link
                  key={a.href}
                  href={a.href}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-sand active:bg-sand-warm transition-colors text-center min-h-[80px] justify-center"
                >
                  <span className="text-2xl" aria-hidden="true">{a.icon}</span>
                  <span className="text-sm font-medium text-ink-soft leading-tight">{a.label}</span>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
