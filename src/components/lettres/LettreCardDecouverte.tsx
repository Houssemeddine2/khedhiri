'use client'

import type { LettreMetadata } from '@/types/lettre'

interface LettreCardDecouverteProps {
  lettre: LettreMetadata
  onLire: (id: string) => void
  isLoading: boolean
}

export default function LettreCardDecouverte({ lettre, onLire, isLoading }: LettreCardDecouverteProps) {
  return (
    <div className={`bg-jasmine rounded-xl p-4 border-l-4 border-terracotta ${!lettre.lue_at ? 'ring-2 ring-terracotta/30' : ''}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">✉️</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-fraunces text-base font-bold text-ink truncate">{lettre.titre}</p>
            {!lettre.lue_at && (
              <span className="px-2 py-0.5 rounded-full bg-terracotta text-white text-xs font-manrope font-semibold">
                Nouvelle !
              </span>
            )}
          </div>
          <p className="font-manrope text-xs text-ink-soft mt-1">
            Reçue le {new Date(lettre.unlock_at).toLocaleDateString('fr-FR', { dateStyle: 'long' })}
          </p>
        </div>
        <button
          onClick={() => onLire(lettre.id)}
          disabled={isLoading}
          className="px-3 py-1.5 rounded-xl bg-terracotta text-white font-manrope text-sm font-semibold hover:bg-terracotta-deep transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          Lire
        </button>
      </div>
    </div>
  )
}
