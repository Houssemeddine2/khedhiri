// src/components/quiz/QuizCard.tsx
'use client'

import { useState } from 'react'
import type { Quiz, QuestionQuiz } from '@/types/quiz'
import { avatarFromEmail, tempsRelatif } from '@/lib/avatar'
import JouerQuiz from './JouerQuiz'
import ValiderReponses from './ValiderReponses'

interface Props {
  quiz: Quiz
  currentUserId: string
  onAction: () => void
}

export default function QuizCard({ quiz, currentUserId, onAction }: Props) {
  const [showJouer, setShowJouer] = useState(false)
  const [questions, setQuestions] = useState<QuestionQuiz[] | null>(null)
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false)
  const [erreurQuestions, setErreurQuestions] = useState<string | null>(null)

  const handleToggleJouer = async () => {
    if (showJouer) {
      setShowJouer(false)
      return
    }
    if (questions !== null) {
      setShowJouer(true)
      return
    }
    setIsLoadingQuestions(true)
    setErreurQuestions(null)
    try {
      const res = await fetch(`/api/quizzes/${quiz.id}/questions`)
      if (res.ok) {
        const { questions: data } = await res.json()
        setQuestions(data)
        setShowJouer(true)
      } else {
        setErreurQuestions('Impossible de charger les questions')
      }
    } catch {
      setErreurQuestions('Erreur réseau')
    } finally {
      setIsLoadingQuestions(false)
    }
  }

  const sessionCourante = quiz.sessions.find(s => s.membre_id === currentUserId)
  const auteurAvatar = avatarFromEmail(quiz.auteur_email)

  const estAuteur = quiz.auteur_id === currentUserId

  return (
    <div className="bg-jasmine rounded-3xl p-4 mb-4 border border-terracotta/10 shadow-sm">
      <div className="flex items-start gap-3 mb-2">
        <div
          role="img"
          className={`w-8 h-8 rounded-full ${auteurAvatar.couleurBg} flex items-center justify-center text-white font-bold font-manrope text-sm flex-shrink-0`}
          aria-label={auteurAvatar.nom}
        >
          {auteurAvatar.initiale}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-fraunces text-base text-ink leading-tight">{quiz.titre}</p>
          <p className="font-manrope text-xs text-ink-soft">
            {quiz.auteur_nom} · {tempsRelatif(quiz.created_at)} · {quiz.nb_questions} question{quiz.nb_questions > 1 ? 's' : ''}
          </p>
          {quiz.description && (
            <p className="font-manrope text-sm text-ink-soft mt-1">{quiz.description}</p>
          )}
        </div>
      </div>

      {/* Scores des membres */}
      <div className="flex flex-wrap gap-2 mb-3">
        {quiz.sessions.map(s => (
          <span
            key={s.session_id}
            className="px-2 py-0.5 bg-sand rounded-full font-manrope text-xs text-ink"
          >
            {s.membre_nom} {s.score}/{s.nb_questions} ✅
          </span>
        ))}
        {quiz.sessions.length === 0 && (
          <span className="font-manrope text-xs text-ink-soft italic">
            Personne n&apos;a encore joué
          </span>
        )}
      </div>

      {/* Bouton Jouer ou score personnel */}
      {sessionCourante ? (
        <p className="font-manrope text-sm text-olive font-semibold mb-2">
          Ton score : {sessionCourante.score}/{sessionCourante.nb_questions} 🎉
        </p>
      ) : (
        <button
          type="button"
          onClick={handleToggleJouer}
          disabled={isLoadingQuestions}
          className="px-4 py-3 rounded-full bg-terracotta text-white font-manrope font-semibold text-sm hover:bg-terracotta-deep disabled:opacity-40 transition-colors mb-2"
        >
          {isLoadingQuestions ? 'Chargement…' : showJouer ? 'Fermer' : 'Jouer 🧩'}
        </button>
      )}

      {erreurQuestions && (
        <p role="alert" className="font-manrope text-xs text-red-600 mb-2">{erreurQuestions}</p>
      )}

      {/* Zone de jeu */}
      {showJouer && questions && !sessionCourante && (
        <JouerQuiz
          quizId={quiz.id}
          questions={questions}
          onTermine={() => { setShowJouer(false); onAction() }}
        />
      )}

      {/* Validation réponses ouvertes (créateur uniquement) */}
      {estAuteur && (
        <>
          <hr className="border-terracotta/10 my-2" />
          <ValiderReponses quizId={quiz.id} />
        </>
      )}
    </div>
  )
}
