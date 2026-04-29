'use client'

import { useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function PresenceTracker() {
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    let userId: string | null = null
    let presenceChannel: ReturnType<typeof supabase.channel> | null = null
    let interval: ReturnType<typeof setInterval> | null = null

    async function init() {
      const { data } = await supabase.auth.getUser()
      userId = data.user?.id ?? null
      if (!userId) return

      // Marque la connexion dans profiles
      await supabase.from('profiles')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', userId)

      // Présence Realtime
      presenceChannel = supabase.channel('online-users')
      presenceChannel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && userId) {
          await presenceChannel!.track({ user_id: userId })
        }
      })

      // Mise à jour last_seen_at toutes les 90 secondes
      interval = setInterval(async () => {
        if (userId) {
          await supabase.from('profiles')
            .update({ last_seen_at: new Date().toISOString() })
            .eq('id', userId)
        }
      }, 90_000)
    }

    init()

    return () => {
      if (interval) clearInterval(interval)
      if (presenceChannel) supabase.removeChannel(presenceChannel)
    }
  }, [])

  return null
}
