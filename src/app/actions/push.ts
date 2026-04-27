'use server'

import { createClient } from '@/lib/supabase/server'

type PushSubscriptionInput = {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

export async function saveSubscription(sub: PushSubscriptionInput): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      {
        user_id:  user.id,
        endpoint: sub.endpoint,
        p256dh:   sub.keys.p256dh,
        auth:     sub.keys.auth,
      },
      { onConflict: 'endpoint' },
    )

  if (error) throw new Error(error.message)
}
