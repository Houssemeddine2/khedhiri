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
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const filleIds = MEMBRES.filter(m => m.email !== 'houssem@khedhiri.me').map(m => m.id)

    const [sessionsRes, analysesRes, notesRes, devoirsRes, absencesRes, observationsRes, evenementsRes] = await Promise.allSettled([
      supabase.from('tutor_sessions').select('*').in('user_id', filleIds).order('updated_at', { ascending: false }),
      admin.from('tutor_analyses').select('*').in('user_id', filleIds).order('created_at', { ascending: false }),
      admin.from('pronote_notes').select('*').in('user_id', filleIds).order('date', { ascending: false }),
      admin.from('pronote_devoirs').select('*').in('user_id', filleIds).order('date_rendu', { ascending: true }),
      admin.from('pronote_absences').select('*').in('user_id', filleIds).order('date_debut', { ascending: false }),
      admin.from('pronote_observations').select('*').in('user_id', filleIds).order('date', { ascending: false }),
      admin.from('pronote_evenements').select('*').in('user_id', filleIds).order('date_debut', { ascending: true }),
    ])

    const filles = MEMBRES.filter(m => filleIds.includes(m.id))

    return (
      <>
        <NavBar />
        <TuteurPapa
          sessions={sessionsRes.status === 'fulfilled' ? (sessionsRes.value.data ?? []) as TutorSession[] : []}
          filles={filles}
          analyses={analysesRes.status === 'fulfilled' ? (analysesRes.value.data ?? []) : []}
          notes={notesRes.status === 'fulfilled' ? (notesRes.value.data ?? []) : []}
          devoirs={devoirsRes.status === 'fulfilled' ? (devoirsRes.value.data ?? []) : []}
          absences={absencesRes.status === 'fulfilled' ? (absencesRes.value.data ?? []) : []}
          observations={observationsRes.status === 'fulfilled' ? (observationsRes.value.data ?? []) : []}
          evenements={evenementsRes.status === 'fulfilled' ? (evenementsRes.value.data ?? []) : []}
        />
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
