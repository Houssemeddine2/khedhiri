// src/components/quiz/ValiderReponses.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ReponseOuverteAValider } from '@/types/quiz'

interface Props {
  quizId: string
}

export default function ValiderReponses({ quizId }: Props) {
  const [reponses, setReponses] = useState<ReponseOuverteAValider[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [validating, setValidating] = useState<string | null>(null)
  const [erreurChargement, setErreurChargement] = useState<string | null>(null)
  const [erreurValidation, setErreurValidation] = useState<string | null>(null)

  const loadReponses = useCallback(async () => {
    try {
      const res = await fetch(`/api/quizzes/${quizId}/reponses-ouvertes`)
      if (res.ok) {
        const { reponses: data } = await res.json()
        setReponses(data)
        setErreurChargement(null)
      } else {
        setErreurChargement('Impossible de charger les réponses.')
      }
    } catch {
      setErreurChargement('Erreur réseau.')
    } finally {
      setIsLoading(false)
    }
  }, [quizId])

  useEffect(() => { loadReponses() }, [loadReponses])

  const handleValider = async (rep: ReponseOuverteAValider, correct: boolean) => {
    setValidating(rep.id)
    setErreurValidation(null)
    try {
      const res = await fetch(`/api/quizzes/${quizId}/sessions/${rep.session_id}/reponses/${rep.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correct }),
      })
      if (!res.ok) {
        const { error } = await res.json()
        setErreurValidation(error ?? 'Erreur lors de la validation')
        return
      }
      await loadReponses()
    } catch {
      setErreurValidation('Erreur réseau')
    } finally {
      setValidating(null)
    }
  }

  if (isLoading) return null

  if (erreurChargement) {
    return <p role="alert" className="font-manrope text-xs text-red-600 mt-2">{erreurChargement}</p>
  }

  if (reponses.length === 0) {
    return (
      <p className="font-manrope text-xs text-ink-soft mt-2">
        Aucune réponse ouverte à valider.
      </p>
    )
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      <p className="font-manrope text-xs text-ink-soft font-semibold">
        Réponses ouvertes à valider ({reponses.length})
      </p>
      {erreurValidation && <p role="alert" className="font-manrope text-xs text-red-600 mb-2">{erreurValidation}</p>}
      {reponses.map(rep => (
        <div key={rep.id} className="bg-jasmine rounded-2xl p-3 border border-terracotta/10">
          <p className="font-manrope text-xs text-ink-soft mb-1">{rep.question_contenu}</p>
          <p className="font-manrope text-sm text-ink mb-1">
            <span className="font-semibold">{rep.membre_nom} :</span> {rep.contenu}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleValider(rep, true)}
              disabled={validating === rep.id}
              className="px-3 py-1 rounded-full bg-olive text-white font-manrope text-xs font-semibold hover:opacity-80 disabled:opacity-40 transition-all"
            >
              {validating === rep.id ? 'En cours…' : '✅ Correct'}
            </button>
            <button
              type="button"
              onClick={() => handleValider(rep, false)}
              disabled={validating === rep.id}
              className="px-3 py-1 rounded-full bg-terracotta text-white font-manrope text-xs font-semibold hover:opacity-80 disabled:opacity-40 transition-all"
            >
              {validating === rep.id ? 'En cours…' : '❌ Incorrect'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
