'use client'

import { useEffect, useState } from 'react'

function heureLocale(timezone: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    timeZone: timezone, hour12: false,
  }).format(new Date())
}

function dateLocale(timezone: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
    timeZone: timezone,
  }).format(new Date())
}

export default function CarteInteractive() {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  void tick // re-render chaque seconde

  const lisbonneHeure = heureLocale('Europe/Lisbon')
  const tunisHeure    = heureLocale('Africa/Tunis')
  const lisbonneDate  = dateLocale('Europe/Lisbon')
  const tunisDate     = dateLocale('Africa/Tunis')

  return (
    <section>
      <h2 className="font-manrope font-semibold text-ink mb-4">Lisbonne ↔ Tunis</h2>

      <div className="relative bg-gradient-to-br from-azur/10 via-cream to-sand rounded-2xl p-6 border border-azur/20 overflow-hidden">
        {/* Décoration mer SVG */}
        <div className="absolute inset-0 pointer-events-none select-none" aria-hidden="true">
          <svg viewBox="0 0 480 200" className="w-full h-full opacity-[0.07]" preserveAspectRatio="xMidYMid slice">
            <ellipse cx="240" cy="110" rx="300" ry="90" fill="#2E5C8A" />
            <path d="M0,70 Q60,55 120,75 Q180,95 240,70 Q300,45 360,70 Q420,95 480,75 L480,200 L0,200 Z" fill="#2E5C8A" />
          </svg>
        </div>

        <div className="relative flex items-center justify-between gap-4">
          {/* Lisbonne */}
          <div className="flex flex-col items-center gap-1 flex-1 text-center">
            <span className="text-4xl" role="img" aria-label="Drapeau Portugal">🇵🇹</span>
            <h3 className="font-fraunces font-bold text-ink text-lg">Lisbonne</h3>
            <p className="font-manrope tabular-nums text-2xl font-bold text-terracotta">{lisbonneHeure}</p>
            <p className="font-manrope text-xs text-ink-soft capitalize">{lisbonneDate}</p>
            <p className="font-manrope text-xs text-terracotta font-medium mt-1">Papa 💙</p>
          </div>

          {/* Séparateur */}
          <div className="flex flex-col items-center gap-1 px-2 flex-shrink-0">
            <span className="text-xl" aria-hidden="true">✈️</span>
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="w-1 h-1 rounded-full bg-azur/40" />
            ))}
            <p className="font-manrope text-xs text-ink-soft text-center leading-tight whitespace-nowrap">
              ~2 000 km
            </p>
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="w-1 h-1 rounded-full bg-azur/40" />
            ))}
          </div>

          {/* Tunis */}
          <div className="flex flex-col items-center gap-1 flex-1 text-center">
            <span className="text-4xl" role="img" aria-label="Drapeau Tunisie">🇹🇳</span>
            <h3 className="font-fraunces font-bold text-ink text-lg">Tunis</h3>
            <p className="font-manrope tabular-nums text-2xl font-bold text-olive">{tunisHeure}</p>
            <p className="font-manrope text-xs text-ink-soft capitalize">{tunisDate}</p>
            <p className="font-manrope text-xs text-olive font-medium mt-1">Sandra & Sarah 💚</p>
          </div>
        </div>
      </div>
    </section>
  )
}
