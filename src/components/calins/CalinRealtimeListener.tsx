// src/components/calins/CalinRealtimeListener.tsx
'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  userId: string
  onNewCalin: () => void
}

export default function CalinRealtimeListener({ userId, onNewCalin }: Props) {
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`calins-recus-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'calins',
          filter: `destinataire_id=eq.${userId}`,
        },
        () => { onNewCalin() },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, onNewCalin])

  return null
}
