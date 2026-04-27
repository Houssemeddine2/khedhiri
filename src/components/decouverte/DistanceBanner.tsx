'use client'

import { useState, useEffect } from 'react'

function heureLocale(timezone: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: timezone,
  }).format(new Date())
}

export default function DistanceBanner() {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="bg-ink rounded-3xl p-6 text-center space-y-4">
      <p className="font-fraunces text-white/70 text-sm italic">Entre nous</p>
      <div className="flex items-center justify-center gap-4">
        <div className="text-center">
          <p className="font-fraunces text-4xl font-bold text-white">🇵🇹</p>
          <p className="font-manrope text-white/80 text-sm mt-1">Lisbonne</p>
          <p className="font-manrope text-gold text-lg font-bold tabular-nums" key={tick}>
            {heureLocale('Europe/Lisbon')}
          </p>
        </div>

        <div className="text-center px-4">
          <p className="font-fraunces text-white text-3xl font-bold">1 892</p>
          <p className="font-manrope text-white/60 text-xs">km</p>
          <div className="flex items-center gap-1 mt-2 justify-center">
            <div className="w-2 h-2 rounded-full bg-terracotta" />
            <div className="w-12 border-t border-dashed border-white/30" />
            <div className="w-2 h-2 rounded-full bg-gold" />
          </div>
          <p className="font-manrope text-white/40 text-xs mt-1">✈ ~2h30</p>
        </div>

        <div className="text-center">
          <p className="font-fraunces text-4xl font-bold text-white">🇹🇳</p>
          <p className="font-manrope text-white/80 text-sm mt-1">Tunis</p>
          <p className="font-manrope text-gold text-lg font-bold tabular-nums" key={tick + 'tunis'}>
            {heureLocale('Africa/Tunis')}
          </p>
        </div>
      </div>
      <p className="font-caveat text-white/50 text-sm">La distance ne diminue jamais l&apos;amour — elle le rend plus précieux</p>
    </div>
  )
}
