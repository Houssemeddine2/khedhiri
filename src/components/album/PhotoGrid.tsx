'use client'

import { useState, useEffect, useTransition } from 'react'
import { deletePost } from '@/app/actions/posts'
import { avatarFromEmail, tempsRelatif } from '@/lib/avatar'

type Photo = {
  id: string
  author_id: string
  media_url: string
  created_at: string
  profiles: { email: string; nom: string } | null
}

interface PhotoGridProps {
  photos: Photo[]
  currentUserId: string
}

export default function PhotoGrid({ photos, currentUserId }: PhotoGridProps) {
  const [selected, setSelected] = useState<Photo | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!selected) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selected])

  if (!photos.length) {
    return (
      <p className="font-manrope text-ink-soft text-center py-16">
        Aucune photo partagée pour l'instant. Partagez une photo dans la timeline !
      </p>
    )
  }

  function handleDelete(photo: Photo) {
    if (!confirm("Supprimer cette photo de l'album ?")) return
    startTransition(async () => {
      await deletePost(photo.id)
      if (selected?.id === photo.id) setSelected(null)
    })
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {photos.map((photo) => {
          const avatar = avatarFromEmail(photo.profiles?.email ?? '')
          const isOwn = photo.author_id === currentUserId
          return (
            <div key={photo.id} className="relative group">
              <button
                onClick={() => setSelected(photo)}
                className="block w-full aspect-square rounded-xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-terracotta"
                aria-label={`Photo de ${avatar.nom}`}
              >
                <img
                  src={photo.media_url}
                  alt={`Photo de ${avatar.nom}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </button>

              <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/50 rounded-full px-2 py-0.5 pointer-events-none">
                <span className={`w-4 h-4 rounded-full ${avatar.couleurBg} flex items-center justify-center text-white text-xs font-bold`}>
                  {avatar.initiale}
                </span>
                <span className="font-manrope text-white text-xs">{avatar.nom}</span>
              </div>

              {isOwn && (
                <button
                  onClick={() => handleDelete(photo)}
                  disabled={isPending}
                  aria-label="Supprimer cette photo"
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-terracotta disabled:opacity-30"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                    <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              )}
            </div>
          )
        })}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Photo en grand format"
        >
          <div
            className="relative max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selected.media_url}
              alt="Photo agrandie"
              className="w-full max-h-[80vh] object-contain rounded-xl"
            />
            <div className="mt-3 flex items-center justify-between">
              {(() => {
                const av = avatarFromEmail(selected.profiles?.email ?? '')
                return (
                  <div className="flex items-center gap-2">
                    <span className={`w-8 h-8 rounded-full ${av.couleurBg} flex items-center justify-center text-white text-sm font-bold`}>
                      {av.initiale}
                    </span>
                    <div>
                      <p className="font-manrope text-white text-sm font-semibold">{av.nom}</p>
                      <p className="font-manrope text-white/60 text-xs">{tempsRelatif(selected.created_at)}</p>
                    </div>
                  </div>
                )
              })()}
              <button
                onClick={() => setSelected(null)}
                className="font-manrope text-white/60 hover:text-white text-sm underline underline-offset-2"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
