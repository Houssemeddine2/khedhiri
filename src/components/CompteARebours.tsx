'use client'

import { useEffect, useState } from 'react'

interface CompteAReboursProps {
  nom: string
  dateNaissance: string // format ISO 'YYYY-MM-DD'
  couleur?: string
}

function calculer18(dateNaissance: string) {
  const naissance = new Date(dateNaissance)
  const dix8 = new Date(naissance)
  dix8.setFullYear(dix8.getFullYear() + 18)
  return dix8
}

function tempsRestant(cible: Date) {
  const maintenant = new Date()
  const diff = cible.getTime() - maintenant.getTime()

  if (diff <= 0) return null

  const jours = Math.floor(diff / (1000 * 60 * 60 * 24))
  const ans = Math.floor(jours / 365)
  const moisRestants = Math.floor((jours % 365) / 30)
  const joursRestants = jours % 30

  return { ans, mois: moisRestants, jours: joursRestants, totalJours: jours }
}

export default function CompteARebours({ nom, dateNaissance, couleur = 'text-terracotta' }: CompteAReboursProps) {
  const date18 = calculer18(dateNaissance)
  const [reste, setReste] = useState(() => tempsRestant(date18))

  useEffect(() => {
    const timer = setInterval(() => {
      setReste(tempsRestant(date18))
    }, 60_000)
    return () => clearInterval(timer)
  }, [date18])

  if (!reste) return null

  const dateStr = date18.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="bg-white rounded-xl p-4 border border-sand">
      {/* En-tête */}
      <div className="flex items-center gap-2 mb-3">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={couleur} aria-hidden="true">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <p className="text-xs font-semibold text-ink-soft uppercase tracking-widest">
          Lettre de {nom}
        </p>
      </div>

      {/* Chiffres */}
      <div className="flex items-end gap-2 mb-2">
        {reste.ans > 0 && (
          <div className="text-center">
            <p className={`text-2xl font-bold font-fraunces leading-none ${couleur}`}>{reste.ans}</p>
            <p className="text-[10px] text-ink-soft mt-0.5">an{reste.ans > 1 ? 's' : ''}</p>
          </div>
        )}
        {(reste.ans > 0 || reste.mois > 0) && (
          <div className="text-center">
            <p className={`text-2xl font-bold font-fraunces leading-none ${couleur}`}>{reste.mois}</p>
            <p className="text-[10px] text-ink-soft mt-0.5">mois</p>
          </div>
        )}
        <div className="text-center">
          <p className={`text-2xl font-bold font-fraunces leading-none ${couleur}`}>{reste.jours}</p>
          <p className="text-[10px] text-ink-soft mt-0.5">jour{reste.jours > 1 ? 's' : ''}</p>
        </div>
      </div>

      <p className="font-caveat text-sm text-ink-soft leading-tight">
        S&apos;ouvre le {dateStr}
      </p>
    </div>
  )
}
