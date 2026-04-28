'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Quiz } from '@/types/quiz'
import QuizCard from './QuizCard'
import CreerQuiz from './CreerQuiz'

interface Props {
  userId: string
}

export default function QuizSection({ userId }: Props) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [showCreer, setShowCreer] = useState(false)

  const loadQuizzes = useCallback(async () => {
    setIsLoading(true)
    setErreur(null)
    try {
      const res = await fetch('/api/quizzes')
      if (res.ok) {
        const { quizzes: data } = await res.json()
        setQuizzes(data)
      } else {
        setErreur('Impossible de charger les quiz')
      }
    } catch {
      setErreur('Erreur réseau')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { loadQuizzes() }, [loadQuizzes])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-fraunces text-xl text-ink">Quiz 🧩</h2>
        {!showCreer && (
          <button
            type="button"
            onClick={() => setShowCreer(true)}
            className="px-4 py-2 rounded-full bg-terracotta text-white font-manrope font-semibold text-sm hover:bg-terracotta-deep transition-colors"
          >
            + Créer un quiz
          </button>
        )}
      </div>

      {showCreer && (
        <CreerQuiz
          onCree={() => { setShowCreer(false); loadQuizzes() }}
          onAnnuler={() => setShowCreer(false)}
        />
      )}

      {isLoading && (
        <p className="font-manrope text-sm text-ink-soft">Chargement…</p>
      )}

      {erreur && (
        <p role="alert" className="font-manrope text-sm text-red-600">{erreur}</p>
      )}

      {!isLoading && !erreur && quizzes.length === 0 && (
        <p className="font-manrope text-sm text-ink-soft italic">
          Aucun quiz pour l&apos;instant. Sois le premier à en créer un !
        </p>
      )}

      {quizzes.map(q => (
        <QuizCard
          key={q.id}
          quiz={q}
          currentUserId={userId}
          onAction={loadQuizzes}
        />
      ))}
    </div>
  )
}
