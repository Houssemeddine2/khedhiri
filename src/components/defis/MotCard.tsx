'use client'

import { useState } from 'react'
import type { Defi } from '@/types/defi'
import { avatarFromEmail, tempsRelatif } from '@/lib/avatar'

interface Props {
  defi: Defi
  currentUserId: string
  onRepondu: () => void
}

export default function MotCard({ defi, currentUserId, onRepondu }: Props) {
  const auteurAv = avatarFromEmail(defi.auteur_email)
  const maReponse = defi.reponses.find(r => r.auteur_id === currentUserId) ?? null
  const [tentative, setTentative] = useState('')
  const [resultatLocal, setResultatLocal] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const handleVerifier = async () => {
    if (!tentative.trim()) return
    setIsLoading(true)
    setErreur(null)
    try {
      const fd = new FormData()
      fd.append('contenu', tentative.trim())
      const res = await fetch(`/api/defis/${defi.id}/reponses`, { method: 'POST', body: fd })
      if (!res.ok) {
        const { error } = await res.json()
        setErreur(error ?? 'Erreur lors de la vérification')
        return
      }
      const { correct } = await res.json()
      setResultatLocal(correct)
      onRepondu()
    } catch {
      setErreur('Erreur réseau')
    } finally {
      setIsLoading(false)
    }
  }

  const showResult = maReponse !== null || resultatLocal !== null
  const isCorrect = maReponse?.correct ?? resultatLocal
  const reponseText = maReponse?.contenu ?? tentative
  const autresReponses = defi.reponses.filter(r => r.auteur_id !== currentUserId)

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
        <span className="text-xs font-manrope font-bold bg-azur/10 text-azur-deep px-2 py-0.5 rounded-full">🔤 Mot</span>
      </div>

      <p className="font-fraunces text-2xl text-ink mb-1">{defi.contenu}</p>
      {defi.indice && (
        <p className="font-manrope text-xs text-ink-soft italic mb-3">Indice : {defi.indice}</p>
      )}

      {showResult ? (
        <div className={`rounded-xl p-3 mb-3 ${isCorrect ? 'bg-olive/10' : 'bg-terracotta/10'}`}>
          <p className="font-manrope text-sm font-semibold text-ink mb-1">
            {isCorrect ? '✅ Bravo !' : '❌ Pas tout à fait…'}
          </p>
          <p className="font-manrope text-sm text-ink-soft">
            Ta réponse : <span className="text-ink">{reponseText}</span>
          </p>
          {!isCorrect && defi.traduction_ar && (
            <p className="font-manrope text-sm text-ink-soft mt-1">
              Bonne réponse : <span className="font-semibold text-ink" dir="rtl">{defi.traduction_ar}</span>
            </p>
          )}
          {isCorrect && defi.traduction_ar && (
            <p className="font-manrope text-sm text-ink" dir="rtl">{defi.traduction_ar}</p>
          )}
        </div>
      ) : (
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={tentative}
            onChange={e => setTentative(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleVerifier()}
            placeholder="Traduction en arabe…"
            aria-label="Ta réponse en arabe"
            dir="auto"
            className="flex-1 rounded-xl border border-terracotta/20 bg-cream px-3 py-2 font-manrope text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/40"
          />
          <button
            type="button"
            onClick={handleVerifier}
            disabled={isLoading || !tentative.trim()}
            className="px-4 py-2 rounded-full bg-azur text-white font-manrope font-semibold text-sm hover:bg-azur-deep disabled:opacity-40 transition-colors"
          >
            {isLoading ? '…' : 'Vérifier'}
          </button>
        </div>
      )}

      {erreur && <p role="alert" className="text-xs text-red-600 font-manrope mb-2">{erreur}</p>}

      {autresReponses.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          {autresReponses.map(r => {
            const av = avatarFromEmail(r.auteur_email)
            return (
              <span key={r.id} className="flex items-center gap-1 text-xs font-manrope text-ink-soft">
                <span aria-hidden="true" className={`w-5 h-5 rounded-full ${av.couleurBg} flex items-center justify-center text-white font-bold text-[10px]`}>
                  {av.initiale}
                </span>
                {r.correct === true ? '✅' : r.correct === false ? '❌' : '—'}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}
