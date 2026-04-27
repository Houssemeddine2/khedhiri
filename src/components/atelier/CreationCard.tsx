'use client'

import { useTransition } from 'react'
import { deleteCreation } from '@/app/actions/atelier'
import { avatarFromEmail, tempsRelatif } from '@/lib/avatar'
import type { Creation } from '@/types/creation'

interface CreationCardProps {
  creation: Creation
  currentUserId: string
  onDeleted: () => void
}

export default function CreationCard({ creation, currentUserId, onDeleted }: CreationCardProps) {
  const [isPending, startTransition] = useTransition()
  const avatar = avatarFromEmail(creation.profiles?.email ?? '')
  const isOwn = creation.author_id === currentUserId

  function handleDelete() {
    if (!confirm('Supprimer cette création ?')) return
    startTransition(async () => {
      await deleteCreation(creation.id)
      onDeleted()
    })
  }

  return (
    <div className="relative group rounded-xl overflow-hidden border border-sand-warm shadow-sm">
      <img
        src={creation.media_url}
        alt={creation.title ?? `Dessin de ${avatar.nom}`}
        className="w-full aspect-square object-cover"
        loading="lazy"
      />

      {creation.title && (
        <div className="px-2 py-1 bg-jasmine">
          <p className="font-caveat text-ink text-sm truncate">{creation.title}</p>
        </div>
      )}

      <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/50 rounded-full px-2 py-0.5 pointer-events-none">
        <span className={`w-4 h-4 rounded-full ${avatar.couleurBg} flex items-center justify-center text-white text-xs font-bold`}>
          {avatar.initiale}
        </span>
        <span className="font-manrope text-white text-xs">{tempsRelatif(creation.created_at)}</span>
      </div>

      {isOwn && (
        <button
          onClick={handleDelete}
          disabled={isPending}
          aria-label="Supprimer cette création"
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-terracotta disabled:opacity-30"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      )}
    </div>
  )
}
