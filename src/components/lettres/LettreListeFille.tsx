'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { LettreMetadata, LettreDecouverte } from '@/types/lettre'
import LettreCardVerrouilee from './LettreCardVerrouilee'
import LettreCardDecouverte from './LettreCardDecouverte'
import LettreDetail from './LettreDetail'

interface LettreListeFilleProps {
  lettres: LettreMetadata[]
  userEmail: string
}

const ANNIVERSAIRES_18: Record<string, Date> = {
  'sandra@khedhiri.me': new Date('2031-11-14T00:00:00'),
  'sarah@khedhiri.me':  new Date('2035-12-14T00:00:00'),
}

function useCompteARebours(cible: Date) {
  const calc = () => {
    const diff = cible.getTime() - Date.now()
    if (diff <= 0) return { jours: 0, heures: 0, minutes: 0, secondes: 0 }
    const jours    = Math.floor(diff / 86400000)
    const heures   = Math.floor((diff % 86400000) / 3600000)
    const minutes  = Math.floor((diff % 3600000) / 60000)
    const secondes = Math.floor((diff % 60000) / 1000)
    return { jours, heures, minutes, secondes }
  }
  const [temps, setTemps] = useState(calc)
  useEffect(() => {
    const id = setInterval(() => setTemps(calc()), 1000)
    return () => clearInterval(id)
  }, [])
  return temps
}

function TimerDixHuitAns({ userEmail }: { userEmail: string }) {
  const cible = ANNIVERSAIRES_18[userEmail]
  const { jours, heures, minutes, secondes } = useCompteARebours(cible ?? new Date())
  if (!cible) return null

  return (
    <div className="flex flex-col items-center py-10 gap-6">
      <div className="text-5xl">📜</div>
      <p className="font-fraunces italic text-lg text-ink text-center leading-snug">
        Les lettres de Papa t&apos;attendent…<br />
        <span className="text-terracotta">elles s&apos;ouvriront le jour de tes 18 ans.</span>
      </p>

      <div className="flex gap-3">
        {[
          { val: jours,    label: 'jours' },
          { val: heures,   label: 'heures' },
          { val: minutes,  label: 'min' },
          { val: secondes, label: 'sec' },
        ].map(({ val, label }) => (
          <div key={label} className="flex flex-col items-center bg-white border border-sand-warm rounded-2xl px-4 py-3 min-w-[64px] shadow-sm">
            <span className="font-fraunces text-2xl font-bold text-terracotta tabular-nums">
              {String(val).padStart(2, '0')}
            </span>
            <span className="font-manrope text-[10px] text-ink-soft uppercase tracking-wide">{label}</span>
          </div>
        ))}
      </div>

      <p className="font-caveat text-sm text-ink-soft/70 text-center">
        Avec tout l&apos;amour du monde ♡
      </p>
    </div>
  )
}

export default function LettreListeFille({ lettres, userEmail }: LettreListeFilleProps) {
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
          <TimerDixHuitAns userEmail={userEmail} />
        )}
      </div>

      {selectedLettre && (
        <LettreDetail lettre={selectedLettre} onClose={() => setSelectedLettre(null)} />
      )}
    </>
  )
}
