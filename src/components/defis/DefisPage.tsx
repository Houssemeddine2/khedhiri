'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { Defi } from '@/types/defi'
import DefiCard from './DefiCard'
import MotCard from './MotCard'
import CreerDefi from './CreerDefi'

interface Props {
  userId: string
}

export default function DefisPage({ userId }: Props) {
  const [defis, setDefis] = useState<Defi[]>([])
  const [showCreer, setShowCreer] = useState(false)

  const loadDefis = useCallback(async () => {
    const res = await fetch('/api/defis')
    if (res.ok) {
      const { defis: data } = await res.json()
      setDefis(data)
    }
  }, [])

  useEffect(() => { loadDefis() }, [loadDefis])

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    const channel = supabase
      .channel('defis-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'defis' }, () => loadDefis())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reponses_defis' }, () => loadDefis())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [loadDefis])

  return (
    <div className="min-h-screen bg-cream pb-32">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-fraunces text-2xl text-ink">Défis & Mots 🎯</h1>
          <button
            onClick={() => setShowCreer(v => !v)}
            className="px-4 py-2 rounded-full bg-terracotta text-white font-manrope font-semibold text-sm hover:bg-terracotta-deep transition-colors"
          >
            {showCreer ? 'Annuler' : '+ Créer'}
          </button>
        </div>

        {showCreer && (
          <CreerDefi
            onCree={() => { setShowCreer(false); loadDefis() }}
            onAnnuler={() => setShowCreer(false)}
          />
        )}

        {defis.length === 0 && !showCreer ? (
          <p className="font-caveat text-center text-ink-soft text-xl mt-16">
            Pas encore de défi… soyez créatifs ! 🎯
          </p>
        ) : (
          defis.map(d =>
            d.type === 'mot' ? (
              <MotCard key={d.id} defi={d} currentUserId={userId} onRepondu={loadDefis} />
            ) : (
              <DefiCard key={d.id} defi={d} currentUserId={userId} onRepondu={loadDefis} />
            )
          )
        )}
      </div>
    </div>
  )
}
