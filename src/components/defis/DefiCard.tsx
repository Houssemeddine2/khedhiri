'use client'

import { useState } from 'react'
import type { Defi } from '@/types/defi'
import { avatarFromEmail, tempsRelatif } from '@/lib/avatar'

interface Props {
  defi: Defi
  currentUserId: string
  onRepondu: () => void
}

export default function DefiCard({ defi, currentUserId, onRepondu }: Props) {
  const auteurAv = avatarFromEmail(defi.auteur_email)
  const maReponse = defi.reponses.find(r => r.auteur_id === currentUserId) ?? null
  const [contenu, setContenu] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!contenu.trim() && !photo) return
    setIsLoading(true)
    setErreur(null)
    try {
      const fd = new FormData()
      fd.append('contenu', contenu.trim() || '📷')
      if (photo) fd.append('photo', photo)
      const res = await fetch(`/api/defis/${defi.id}/reponses`, { method: 'POST', body: fd })
      if (!res.ok) {
        const { error } = await res.json()
        setErreur(error ?? 'Erreur lors de l\'envoi')
        return
      }
      onRepondu()
    } catch {
      setErreur('Erreur réseau')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-jasmine rounded-3xl p-4 mb-4 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div aria-hidden="true" className={`w-9 h-9 rounded-full ${auteurAv.couleurBg} flex items-center justify-center text-white font-bold text-base flex-shrink-0`}>
          {auteurAv.initiale}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-manrope font-semibold text-sm text-ink">{defi.auteur_nom}</p>
          <p className="font-manrope text-xs text-ink-soft">{tempsRelatif(defi.created_at)}</p>
        </div>
        <span className="text-xs font-manrope font-bold bg-terracotta/10 text-terracotta px-2 py-0.5 rounded-full">🎯 Défi</span>
      </div>

      <p className="font-manrope text-base text-ink mb-3">{defi.contenu}</p>

      {defi.reponses.length > 0 && (
        <div className="flex flex-col gap-2 mb-3">
          {defi.reponses.map(r => {
            const rAv = avatarFromEmail(r.auteur_email)
            return (
              <div key={r.id} className="flex items-start gap-2 bg-cream/70 rounded-xl p-2">
                <div aria-hidden="true" className={`w-7 h-7 rounded-full ${rAv.couleurBg} flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mt-0.5`}>
                  {rAv.initiale}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-manrope text-xs font-semibold text-ink">{r.auteur_nom}</p>
                  {r.contenu !== '📷' && <p className="font-manrope text-sm text-ink">{r.contenu}</p>}
                  {r.photo_url && (
                    <img
                      src={r.photo_url}
                      alt={`Réponse de ${r.auteur_nom}`}
                      className="mt-1 rounded-lg max-h-48 object-cover w-full"
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!maReponse ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={contenu}
            onChange={e => setContenu(e.target.value)}
            placeholder="Ta réponse…"
            rows={2}
            aria-label="Ta réponse au défi"
            className="w-full rounded-xl border border-terracotta/20 bg-cream px-3 py-2 font-manrope text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/40 resize-none"
          />
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 text-xs font-manrope text-ink-soft cursor-pointer">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={e => setPhoto(e.target.files?.[0] ?? null)}
              />
              <span className="px-2 py-1 rounded-lg bg-sand border border-terracotta/20 hover:bg-sand-warm transition-colors">
                📷 {photo ? photo.name.slice(0, 15) + '…' : 'Photo'}
              </span>
            </label>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || (!contenu.trim() && !photo)}
              className="ml-auto px-4 py-1.5 rounded-full bg-terracotta text-white font-manrope font-semibold text-sm hover:bg-terracotta-deep disabled:opacity-40 transition-colors"
            >
              {isLoading ? 'Envoi…' : 'Répondre'}
            </button>
          </div>
          {erreur && <p role="alert" className="text-xs text-red-600 font-manrope">{erreur}</p>}
        </div>
      ) : (
        <p className="font-manrope text-sm text-olive font-semibold">✓ Tu as répondu</p>
      )}
    </div>
  )
}
