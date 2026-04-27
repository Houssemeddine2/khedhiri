import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

webpush.setVapidDetails(
  'mailto:houssem@khedhiri.me',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

// Client service_role : contourne le RLS pour lire les abonnements de n'importe quel user
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

type PushPayload = { title: string; body: string; url?: string }

export async function sendNotificationToUsers(
  userIds: string[],
  payload: PushPayload,
): Promise<void> {
  if (!userIds.length) return

  const { data: subs } = await supabaseAdmin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .in('user_id', userIds)

  if (!subs?.length) return

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
        )
      } catch (err: unknown) {
        // 410 Gone = abonnement expiré → supprimer proprement
        if (
          typeof err === 'object' &&
          err !== null &&
          'statusCode' in err &&
          (err as { statusCode: number }).statusCode === 410
        ) {
          await supabaseAdmin.from('push_subscriptions').delete().eq('id', sub.id)
        }
      }
    }),
  )
}
