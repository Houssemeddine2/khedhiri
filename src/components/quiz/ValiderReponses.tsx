// src/components/quiz/ValiderReponses.tsx
'use client'

import { useState, useEffect } from 'react'
import type { ReponseOuverteAValider } from '@/types/quiz'

interface Props {
  quizId: string
}

export default function ValiderReponses({ quizId }: Props) {
  const [reponses, setReponses] = useState<ReponseOuverteAValider[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [validating, setValidating] = useState<string | null>(null)

  const loadReponses = async () => {
    const res = await fetch(`/api/quizzes/${quizId}/reponses-ouvertes`)
    if (res.ok) {
      const { reponses: data } = await res.json()
      setReponses(data)
    }
    setIsLoading(false)
  }

  useEffect(() => { loadReponses() }, [quizId])

  const handleValider = async (rep: ReponseOuverteAValider, correct: boolean) => {
    setValidating(rep.id)
    try {
      await fetch(`/api/quizzes/${quizId}/sessions/${rep.session_id}/reponses/${rep.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correct }),
      })
      await loadReponses()
    } finally {
      setValidating(null)
    }
  }

  if (isLoading) return null

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
              ✅ Correct
            </button>
            <button
              type="button"
              onClick={() => handleValider(rep, false)}
              disabled={validating === rep.id}
              className="px-3 py-1 rounded-full bg-terracotta text-white font-manrope text-xs font-semibold hover:opacity-80 disabled:opacity-40 transition-all"
            >
              ❌ Incorrect
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
