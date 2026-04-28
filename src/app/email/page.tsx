import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NavBar from '@/components/NavBar'
import EmailSetupWrapper from '@/components/email/EmailSetupWrapper'
import EmailInboxWrapper from '@/components/email/EmailInboxWrapper'

const PAPA_EMAIL = 'houssem@khedhiri.me'

export default async function EmailPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: creds } = await supabase
    .from('email_credentials')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  const isConfigured = !!creds
  const isPapa = user.email === PAPA_EMAIL

  return (
    <>
      <NavBar />
      <main>
        {isConfigured
          ? <EmailInboxWrapper isPapa={isPapa} />
          : <EmailSetupWrapper isPapa={isPapa} />
        }
      </main>
    </>
  )
}
