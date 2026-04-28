'use client'

import type { LettreDecouverte } from '@/types/lettre'

interface LettreDetailProps {
  lettre: LettreDecouverte
  onClose: () => void
}

export default function LettreDetail({ lettre, onClose }: LettreDetailProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bg-jasmine rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="font-fraunces text-xl font-bold text-ink">{lettre.titre}</h2>
            <p className="font-manrope text-xs text-ink-soft mt-1">
              Écrite le {new Date(lettre.created_at).toLocaleDateString('fr-FR', { dateStyle: 'long' })}
            </p>
          </div>
          <button onClick={onClose} className="text-ink-soft hover:text-ink text-2xl leading-none" aria-label="Fermer">×</button>
        </div>

        <div className="font-manrope text-sm text-ink leading-relaxed whitespace-pre-wrap bg-white rounded-xl p-4 mb-6">
          {lettre.contenu}
        </div>

        <p className="font-fraunces text-base italic text-terracotta text-right">Papa ♡</p>
      </div>
    </div>
  )
}
