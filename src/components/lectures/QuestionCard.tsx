// src/components/lectures/QuestionCard.tsx
'use client'

import { useState } from 'react'
import type { QuestionLecture } from '@/types/lecture'
import { avatarFromEmail, tempsRelatif } from '@/lib/avatar'

interface Props {
  question: QuestionLecture
  lectureId: string
  currentUserId: string
  onRepondu: () => void
}

export default function QuestionCard({ question, lectureId, currentUserId, onRepondu }: Props) {
  const auteurAv = avatarFromEmail(question.auteur_email)
  const maReponse = question.reponses.find(r => r.auteur_id === currentUserId) ?? null
  const [contenu, setContenu] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const handleRepondre = async () => {
    if (!contenu.trim()) return
    setIsLoading(true)
    setErreur(null)
    try {
      const res = await fetch(
        `/api/lectures/${lectureId}/questions/${question.id}/reponses`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contenu: contenu.trim() }),
        },
      )
      if (!res.ok) {
        const { error } = await res.json()
        setErreur(error ?? 'Erreur lors de l\'envoi')
        return
      }
      setContenu('')
      onRepondu()
    } catch {
      setErreur('Erreur réseau')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-cream/80 rounded-xl p-3 mb-2">
      <div className="flex items-center gap-2 mb-2">
        <div aria-hidden="true" className={`w-7 h-7 rounded-full ${auteurAv.couleurBg} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
          {auteurAv.initiale}
        </div>
        <div className="flex-1 min-w-0">
          <span className="font-manrope font-semibold text-xs text-ink">{question.auteur_nom}</span>
          <span className="font-manrope text-xs text-ink-soft ml-2">{tempsRelatif(question.created_at)}</span>
        </div>
      </div>

      <p className="font-manrope text-sm text-ink mb-2">{question.contenu}</p>

      {question.reponses.length > 0 && (
        <div className="flex flex-col gap-1 mb-2 pl-3 border-l-2 border-terracotta/20">
          {question.reponses.map(r => {
            const rAv = avatarFromEmail(r.auteur_email)
            return (
              <div key={r.id} className="flex items-start gap-2">
                <div aria-hidden="true" className={`w-5 h-5 rounded-full ${rAv.couleurBg} flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0 mt-0.5`}>
                  {rAv.initiale}
                </div>
                <p className="font-manrope text-xs text-ink">{r.contenu}</p>
              </div>
            )
          })}
        </div>
      )}

      {!maReponse ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={contenu}
            onChange={e => setContenu(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRepondre()}
            placeholder="Ta réponse…"
            aria-label="Ta réponse à la question"
            className="flex-1 rounded-lg border border-terracotta/20 bg-cream px-3 py-1.5 font-manrope text-xs text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/40"
          />
          <button
            type="button"
            onClick={handleRepondre}
            disabled={isLoading || !contenu.trim()}
            className="px-3 py-1.5 rounded-lg bg-terracotta text-white font-manrope font-semibold text-xs hover:bg-terracotta-deep disabled:opacity-40 transition-colors"
          >
            {isLoading ? '…' : 'Répondre'}
          </button>
        </div>
      ) : (
        <p className="font-manrope text-xs text-olive font-semibold">✓ Tu as répondu</p>
      )}
      {erreur && <p role="alert" className="text-xs text-red-600 font-manrope mt-1">{erreur}</p>}
    </div>
  )
}
