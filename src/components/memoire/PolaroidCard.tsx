'use client'

import type { Souvenir } from '@/types/memoire'
import { avatarFromEmail } from '@/lib/avatar'

interface PolaroidCardProps {
  souvenir: Souvenir
  onClick: () => void
}

function rotationDeg(id: string): number {
  const seed = id.charCodeAt(0) + id.charCodeAt(id.length - 1)
  return (seed % 7) - 3 // -3 à +3 degrés
}

export default function PolaroidCard({ souvenir, onClick }: PolaroidCardProps) {
  const deg = rotationDeg(souvenir.id)
  const auteur = avatarFromEmail(souvenir.profiles?.email ?? '')

  const hasPhoto = !!souvenir.photo_url
  const hasDessin = !!souvenir.creation_id && !!souvenir.creations?.media_url
  const hasAudio = !!souvenir.audio_url
  const imageUrl = souvenir.photo_url ?? souvenir.creations?.media_url ?? null

  return (
    <button
      onClick={onClick}
      className="bg-white p-2 pb-8 shadow-md hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-terracotta"
      style={{ transform: `rotate(${deg}deg)` }}
      aria-label={`Souvenir : ${souvenir.titre}`}
    >
      {/* Image ou placeholder */}
      <div className="w-full aspect-square bg-sand overflow-hidden flex items-center justify-center mb-2">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={souvenir.titre}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : hasAudio ? (
          <span className="text-4xl">🎵</span>
        ) : (
          <span className="text-4xl">✍️</span>
        )}
      </div>

      {/* Légende polaroïd */}
      <p className="font-caveat text-ink text-sm text-center leading-tight px-1 truncate">
        {souvenir.titre}
      </p>
      <p className="font-manrope text-ink-soft text-xs text-center mt-0.5">
        {auteur.nom} · {new Date(souvenir.date_souvenir).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
      </p>
    </button>
  )
}
