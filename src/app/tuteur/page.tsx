import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import NavBar from '@/components/NavBar'
import TuteurChat from '@/components/tutor/TuteurChat'
import TuteurPapa from '@/components/tutor/TuteurPapa'
import { avatarFromEmail } from '@/lib/avatar'
import { MEMBRES } from '@/lib/membres'
import type { TutorSession, TutorMessage } from '@/types/tutor'

export default async function TuteurPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const isPapa = user.email === 'houssem@khedhiri.me'

  if (isPapa) {
    // Papa voit l'historique de toutes les sessions (admin client)
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const filles = MEMBRES.filter(m => m.email !== 'houssem@khedhiri.me')
    const fillesIds = filles.map(f => f.id)

    const { data: sessions } = await admin
      .from('tutor_sessions')
      .select('*, tutor_messages(count)')
      .in('user_id', fillesIds)
      .order('updated_at', { ascending: false })
      .limit(50)

    return (
      <>
        <NavBar />
        <TuteurPapa sessions={(sessions ?? []) as TutorSession[]} filles={filles} />
      </>
    )
  }

  const prenom = avatarFromEmail(user.email ?? '').nom

  // Charge la dernière session ou crée une
  const { data: sessions } = await supabase
    .from('tutor_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(10)

  const lastSession = sessions?.[0] ?? null

  const { data: messages } = lastSession
    ? await supabase
        .from('tutor_messages')
        .select('*')
        .eq('session_id', lastSession.id)
        .order('created_at', { ascending: true })
    : { data: [] }

  return (
    <>
      <NavBar />
      <TuteurChat
        prenom={prenom}
        sessions={(sessions ?? []) as TutorSession[]}
        initialMessages={(messages ?? []) as TutorMessage[]}
        initialSessionId={lastSession?.id ?? null}
      />
    </>
  )
}
