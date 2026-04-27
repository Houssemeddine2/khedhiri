'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { Souvenir } from '@/types/memoire'
import { avatarFromEmail } from '@/lib/avatar'
import { supprimerSouvenir } from '@/app/actions/memoire'

interface SouvenirDetailProps {
  souvenir: Souvenir
  currentUserId: string
  isPapa: boolean
  onClose: () => void
}

export default function SouvenirDetail({ souvenir, currentUserId, isPapa, onClose }: SouvenirDetailProps) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const auteur = avatarFromEmail(souvenir.profiles?.email ?? '')
  const peutSupprimer = isPapa || currentUserId === souvenir.user_id
  const imageUrl = souvenir.photo_url ?? souvenir.creations?.media_url ?? null

  async function handleSupprimer() {
    if (!confirm('Supprimer ce souvenir ?')) return
    setIsPending(true)
    await supprimerSouvenir(souvenir.id)
    router.refresh()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-jasmine rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-fraunces text-xl font-bold text-ink">{souvenir.titre}</h2>
          <button onClick={onClose} className="text-ink-soft hover:text-ink text-2xl leading-none" aria-label="Fermer">×</button>
        </div>

        {imageUrl && (
          <img src={imageUrl} alt={souvenir.titre} className="w-full rounded-xl mb-4 max-h-64 object-cover" />
        )}

        {souvenir.audio_url && (
          <audio controls src={souvenir.audio_url} className="w-full mb-4" />
        )}

        {souvenir.texte && (
          <p className="font-manrope text-ink text-sm leading-relaxed mb-4 whitespace-pre-wrap">{souvenir.texte}</p>
        )}

        <div className="flex items-center justify-between text-xs font-manrope text-ink-soft">
          <span>Par {souvenir.profiles?.nom ?? auteur.nom} · {new Date(souvenir.date_souvenir).toLocaleDateString('fr-FR', { dateStyle: 'long' })}</span>
          {peutSupprimer && (
            <button
              onClick={handleSupprimer}
              disabled={isPending}
              className="text-terracotta hover:underline disabled:opacity-50"
            >
              Supprimer
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
