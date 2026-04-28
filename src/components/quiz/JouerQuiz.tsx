// src/components/quiz/JouerQuiz.tsx
'use client'

import { useState } from 'react'
import type { QuestionQuiz, ReponseQuizInput } from '@/types/quiz'

interface Props {
  quizId: string
  questions: QuestionQuiz[]
  onTermine: () => void
}

export default function JouerQuiz({ quizId, questions, onTermine }: Props) {
  const [reponses, setReponses] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [resultat, setResultat] = useState<{ score: number; nb_questions: number } | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)

  const setReponse = (questionId: string, contenu: string) => {
    setReponses(prev => ({ ...prev, [questionId]: contenu }))
  }

  const toutesRepondues = questions.every(q => reponses[q.id]?.trim())

  const handleSoumettre = async () => {
    if (!toutesRepondues) return
    setIsLoading(true)
    setErreur(null)
    try {
      const payload: { reponses: ReponseQuizInput[] } = {
        reponses: questions.map(q => ({ question_id: q.id, contenu: reponses[q.id] })),
      }
      const res = await fetch(`/api/quizzes/${quizId}/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const { error } = await res.json()
        setErreur(error ?? 'Erreur lors de la soumission')
        return
      }
      const data = await res.json()
      setResultat({ score: data.score, nb_questions: data.nb_questions })
      onTermine()
    } catch {
      setErreur('Erreur réseau')
    } finally {
      setIsLoading(false)
    }
  }

  if (resultat) {
    return (
      <div className="text-center py-4">
        <p className="font-fraunces text-2xl text-ink mb-1">
          Tu as eu {resultat.score}/{resultat.nb_questions} ! 🎉
        </p>
        <p className="font-manrope text-sm text-ink-soft">
          {resultat.score === resultat.nb_questions
            ? 'Parfait ! Bravo !'
            : resultat.score > resultat.nb_questions / 2
            ? 'Bien joué !'
            : 'Continue à apprendre !'}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 mt-2">
      {questions.map((q, i) => (
        <div key={q.id} className="bg-cream rounded-2xl p-3 border border-terracotta/10">
          <p className="font-manrope text-sm text-ink font-semibold mb-2">
            {i + 1}. {q.contenu}
          </p>

          {q.type === 'qcm' && q.options && (
            <div className="flex flex-col gap-1">
              {q.options.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setReponse(q.id, opt)}
                  className={`w-full text-left px-3 py-2 rounded-xl font-manrope text-sm transition-all ${
                    reponses[q.id] === opt
                      ? 'bg-terracotta text-white'
                      : 'bg-jasmine border border-terracotta/20 text-ink hover:border-terracotta/40'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {q.type === 'vrai_faux' && (
            <div className="flex gap-2">
              {['vrai', 'faux'].map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setReponse(q.id, opt)}
                  className={`flex-1 py-2 rounded-xl font-manrope text-sm font-semibold capitalize transition-all ${
                    reponses[q.id] === opt
                      ? 'bg-terracotta text-white'
                      : 'bg-jasmine border border-terracotta/20 text-ink hover:border-terracotta/40'
                  }`}
                >
                  {opt === 'vrai' ? '✅ Vrai' : '❌ Faux'}
                </button>
              ))}
            </div>
          )}

          {q.type === 'ouverte' && (
            <textarea
              value={reponses[q.id] ?? ''}
              onChange={e => setReponse(q.id, e.target.value)}
              placeholder="Ta réponse…"
              aria-label={`Réponse à la question ${i + 1}`}
              rows={2}
              className="w-full rounded-xl border border-terracotta/20 bg-jasmine px-3 py-2 font-manrope text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/40 resize-none"
            />
          )}
        </div>
      ))}

      {erreur && <p role="alert" className="text-xs text-red-600 font-manrope">{erreur}</p>}

      <button
        type="button"
        onClick={handleSoumettre}
        disabled={isLoading || !toutesRepondues}
        className="w-full py-3 rounded-full bg-terracotta text-white font-manrope font-semibold text-sm hover:bg-terracotta-deep disabled:opacity-40 transition-colors"
      >
        {isLoading ? 'Envoi…' : 'Soumettre 🎯'}
      </button>
    </div>
  )
}
