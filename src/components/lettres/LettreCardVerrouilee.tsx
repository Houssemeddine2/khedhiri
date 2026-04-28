'use client'

import { useState, useEffect } from 'react'
import type { LettreMetadata } from '@/types/lettre'

interface LettreCardVerrouileeProps {
  lettre: LettreMetadata
}

export default function LettreCardVerrouilee({ lettre }: LettreCardVerrouileeProps) {
  const [countdown, setCountdown] = useState('')

  useEffect(() => {
    function update() {
      const diff = new Date(lettre.unlock_at).getTime() - Date.now()
      if (diff <= 0) { setCountdown('Bientôt !'); return }
      const days = Math.floor(diff / 86400000)
      const hours = Math.floor((diff % 86400000) / 3600000)
      setCountdown(days > 0 ? `${days} jour${days > 1 ? 's' : ''} et ${hours}h` : `${hours}h`)
    }
    update()
    const timer = setInterval(update, 60000)
    return () => clearInterval(timer)
  }, [lettre.unlock_at])

  return (
    <div className="bg-white rounded-xl p-4 border-l-4 border-sand-warm opacity-80">
      <div className="flex items-start gap-3">
        <span className="text-2xl">📜</span>
        <div className="flex-1 min-w-0">
          <p className="font-fraunces text-base font-bold text-ink truncate">{lettre.titre}</p>
          <p className="font-manrope text-xs text-ink-soft mt-1">Une lettre t&apos;attend...</p>
          {countdown && (
            <p className="font-manrope text-sm font-semibold text-terracotta mt-1">⏳ {countdown}</p>
          )}
          <p className="font-manrope text-xs text-ink-soft mt-1">
            S&apos;ouvre le {new Date(lettre.unlock_at).toLocaleDateString('fr-FR', { dateStyle: 'long' })}
          </p>
        </div>
      </div>
    </div>
  )
}
