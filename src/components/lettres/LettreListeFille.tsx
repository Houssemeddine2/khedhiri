'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { LettreMetadata, LettreDecouverte } from '@/types/lettre'
import LettreCardVerrouilee from './LettreCardVerrouilee'
import LettreCardDecouverte from './LettreCardDecouverte'
import LettreDetail from './LettreDetail'

interface LettreListeFilleProps {
  lettres: LettreMetadata[]
}

export default function LettreListeFille({ lettres }: LettreListeFilleProps) {
  const router = useRouter()
  const [selectedLettre, setSelectedLettre] = useState<LettreDecouverte | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const now = new Date()
  const verrouilees = lettres.filter(l => new Date(l.unlock_at) > now)
  const decouvertes = lettres.filter(l => new Date(l.unlock_at) <= now)

  async function handleLire(id: string) {
    setLoadingId(id)
    try {
      const res = await fetch(`/api/lettres/${id}`)
      if (!res.ok) return
      const data = await res.json() as { lettre: LettreDecouverte; decouverte: boolean }
      if (data.decouverte) {
        setSelectedLettre(data.lettre)
        router.refresh()
      }
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="font-fraunces text-2xl font-bold text-ink mb-2">Lettres de Papa 📜</h1>
        <p className="font-manrope text-sm text-ink-soft mb-6">Des mots écrits avec amour, qui attendent leur moment.</p>

        {decouvertes.length > 0 && (
          <section className="mb-6">
            <h2 className="font-fraunces text-base font-semibold text-ink mb-3">Lettres ouvertes</h2>
            <div className="space-y-3">
              {decouvertes.map(l => (
                <LettreCardDecouverte key={l.id} lettre={l} onLire={handleLire} isLoading={loadingId === l.id} />
              ))}
            </div>
          </section>
        )}

        {verrouilees.length > 0 && (
          <section>
            <h2 className="font-fraunces text-base font-semibold text-ink mb-3">Lettres en attente</h2>
            <div className="space-y-3">
              {verrouilees.map(l => (
                <LettreCardVerrouilee key={l.id} lettre={l} />
              ))}
            </div>
          </section>
        )}

        {lettres.length === 0 && (
          <p className="font-manrope text-sm text-ink-soft italic text-center py-12">
            Papa n&apos;a pas encore écrit de lettre. Elle arrivera bientôt. ♡
          </p>
        )}
      </div>

      {selectedLettre && (
        <LettreDetail lettre={selectedLettre} onClose={() => setSelectedLettre(null)} />
      )}
    </>
  )
}
