// src/components/calins/CalinPage.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Vocal, Calin } from '@/types/calin'
import BibliothequeVocaux from './BibliothequeVocaux'
import EnvoyerCalin from './EnvoyerCalin'
import CalinsRecus from './CalinsRecus'
import CalinRealtimeListener from './CalinRealtimeListener'

interface Props {
  userId: string
}

export default function CalinPage({ userId }: Props) {
  const [vocaux, setVocaux] = useState<Vocal[]>([])
  const [calins, setCalins] = useState<Calin[]>([])

  const loadVocaux = useCallback(async () => {
    const res = await fetch('/api/calins/vocaux')
    if (res.ok) {
      const { vocaux: data } = await res.json()
      setVocaux(data)
    }
  }, [])

  const loadCalins = useCallback(async () => {
    const res = await fetch('/api/calins')
    if (res.ok) {
      const { calins: data } = await res.json()
      setCalins(data)
    }
  }, [])

  useEffect(() => {
    loadVocaux()
    loadCalins()
  }, [loadVocaux, loadCalins])

  return (
    <>
      <CalinRealtimeListener userId={userId} onNewCalin={loadCalins} />

      <div className="flex flex-col gap-8">
        <EnvoyerCalin
          userId={userId}
          vocaux={vocaux}
          onCalinEnvoye={loadCalins}
        />

        <hr className="border-terracotta/10" />

        <BibliothequeVocaux
          vocaux={vocaux}
          onVocauxChange={loadVocaux}
        />

        <hr className="border-terracotta/10" />

        <CalinsRecus
          calins={calins}
          onCalinsChange={loadCalins}
        />
      </div>
    </>
  )
}
