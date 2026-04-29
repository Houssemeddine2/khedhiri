'use client'

import { useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

// Maintient last_seen_at à jour dans profiles (historique)
// La présence temps réel est gérée par PresenceContext
export default function PresenceTracker() {
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    let userId: string | null = null
    let interval: ReturnType<typeof setInterval> | null = null

    async function init() {
      const { data } = await supabase.auth.getUser()
      userId = data.user?.id ?? null
      if (!userId) return

      await supabase.from('profiles')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', userId)

      interval = setInterval(async () => {
        if (userId) {
          await supabase.from('profiles')
            .update({ last_seen_at: new Date().toISOString() })
            .eq('id', userId)
        }
      }, 90_000)
    }

    init()
    return () => { if (interval) clearInterval(interval) }
  }, [])

  return null
}
