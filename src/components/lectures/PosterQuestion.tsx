// src/components/lectures/PosterQuestion.tsx
'use client'

import { useState } from 'react'

interface Props {
  lectureId: string
  onPostee: () => void
}

export default function PosterQuestion({ lectureId, onPostee }: Props) {
  const [contenu, setContenu] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const handlePoster = async () => {
    if (!contenu.trim()) return
    setIsLoading(true)
    setErreur(null)
    try {
      const res = await fetch(`/api/lectures/${lectureId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenu: contenu.trim() }),
      })
      if (!res.ok) {
        const { error } = await res.json()
        setErreur(error ?? 'Erreur lors de la publication')
        return
      }
      setContenu('')
      onPostee()
    } catch {
      setErreur('Erreur réseau')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mt-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={contenu}
          onChange={e => setContenu(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handlePoster()}
          placeholder="Poser une question sur ce livre…"
          aria-label="Nouvelle question sur le livre"
          className="flex-1 rounded-xl border border-terracotta/20 bg-cream px-3 py-2 font-manrope text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/40"
        />
        <button
          type="button"
          onClick={handlePoster}
          disabled={isLoading || !contenu.trim()}
          className="px-4 py-2 rounded-full bg-terracotta text-white font-manrope font-semibold text-sm hover:bg-terracotta-deep disabled:opacity-40 transition-colors"
        >
          {isLoading ? '…' : '+ Question'}
        </button>
      </div>
      {erreur && <p role="alert" className="text-xs text-red-600 font-manrope mt-1">{erreur}</p>}
    </div>
  )
}
