import { createClient } from '@/lib/supabase/server'
import { avatarFromEmail } from '@/lib/avatar'
import TuteurWidget from './TuteurWidget'

export default async function TuteurWidgetWrapper() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Widget visible uniquement pour Sandra et Sarah (pas Papa, pas visiteur non connecté)
  if (!user) return null
  if (user.email === 'houssem@khedhiri.me') return null

  const prenom = avatarFromEmail(user.email ?? '').nom
  return <TuteurWidget prenom={prenom} />
}
