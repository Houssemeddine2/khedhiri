'use client'

import { useState, useCallback } from 'react'
import type { Lecture, QuestionLecture } from '@/types/lecture'
import { avatarFromEmail, tempsRelatif } from '@/lib/avatar'
import QuestionCard from './QuestionCard'
import PosterQuestion from './PosterQuestion'

const STATUTS = [
  { value: 'pas_commence', label: '— Pas commencé' },
  { value: 'en_cours',     label: '📖 En cours' },
  { value: 'termine',      label: '✅ Terminé' },
] as const

interface Props {
  lecture: Lecture
  currentUserId: string
  onUpdated: () => void
}

export default function LectureCard({ lecture, currentUserId, onUpdated }: Props) {
  const auteurAv = avatarFromEmail(lecture.auteur_email)
  const monAvancement = lecture.avancements.find(a => a.membre_id === currentUserId)
  const monStatut = monAvancement?.statut ?? 'pas_commence'
  const autresAvancements = lecture.avancements.filter(a => a.membre_id !== currentUserId)

  const [questions, setQuestions] = useState<QuestionLecture[] | null>(null)
  const [showQuestions, setShowQuestions] = useState(false)
  const [loadingQ, setLoadingQ] = useState(false)
  const [isUpdatingAv, setIsUpdatingAv] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const loadQuestions = useCallback(async () => {
    setLoadingQ(true)
    try {
      const res = await fetch(`/api/lectures/${lecture.id}/questions`)
      if (res.ok) {
        const { questions: data } = await res.json()
        setQuestions(data)
      }
    } finally {
      setLoadingQ(false)
    }
  }, [lecture.id])

  const handleToggleQuestions = async () => {
    if (!showQuestions && questions === null) await loadQuestions()
    setShowQuestions(v => !v)
  }

  const handleAvancement = async (statut: string) => {
    if (statut === monStatut) return
    setIsUpdatingAv(true)
    setErreur(null)
    try {
      const res = await fetch(`/api/lectures/${lecture.id}/avancement`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut }),
      })
      if (!res.ok) {
        const { error } = await res.json()
        setErreur(error ?? 'Erreur')
        return
      }
      onUpdated()
    } catch {
      setErreur('Erreur réseau')
    } finally {
      setIsUpdatingAv(false)
    }
  }

  const statutEmoji = (statut: string) => {
    if (statut === 'en_cours') return '📖'
    if (statut === 'termine') return '✅'
    return '—'
  }

  return (
    <div className="bg-jasmine rounded-3xl p-4 mb-4 shadow-sm">
      <div className="flex gap-3 mb-3">
        {lecture.couverture_url ? (
          <img
            src={lecture.couverture_url}
            alt={`Couverture de ${lecture.titre}`}
            className="w-14 h-20 object-cover rounded-lg flex-shrink-0"
          />
        ) : (
          <div className="w-14 h-20 bg-sand rounded-lg flex items-center justify-center flex-shrink-0" aria-hidden="true">
            <span className="text-2xl">📚</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-fraunces text-base text-ink leading-tight mb-0.5">{lecture.titre}</p>
          <p className="font-manrope text-xs text-ink-soft italic mb-2">{lecture.auteur_livre}</p>
          <div className="flex items-center gap-2 mb-2">
            <div aria-hidden="true" className={`w-5 h-5 rounded-full ${auteurAv.couleurBg} flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0`}>
              {auteurAv.initiale}
            </div>
            <span className="font-manrope text-xs text-ink-soft">{lecture.auteur_nom} · {tempsRelatif(lecture.created_at)}</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {autresAvancements.map(a => {
              const av = avatarFromEmail(a.membre_email)
              return (
                <span key={a.membre_id} className="flex items-center gap-1 text-xs font-manrope text-ink-soft" title={`${a.membre_nom} : ${a.statut.replace('_', ' ')}`}>
                  <span aria-hidden="true" className={`w-4 h-4 rounded-full ${av.couleurBg} flex items-center justify-center text-white font-bold text-[9px]`}>
                    {av.initiale}
                  </span>
                  {statutEmoji(a.statut)}
                </span>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex gap-1 mb-3" role="radiogroup" aria-label="Mon avancement">
        {STATUTS.map(s => (
          <button
            key={s.value}
            type="button"
            role="radio"
            aria-checked={monStatut === s.value}
            onClick={() => handleAvancement(s.value)}
            disabled={isUpdatingAv}
            className={`flex-1 py-1.5 rounded-full font-manrope text-xs font-semibold transition-all ${
              monStatut === s.value
                ? 'bg-terracotta text-white'
                : 'bg-cream text-ink-soft border border-terracotta/20 hover:border-terracotta/40'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {erreur && <p role="alert" className="text-xs text-red-600 font-manrope mb-2">{erreur}</p>}

      <button
        type="button"
        onClick={handleToggleQuestions}
        className="font-manrope text-sm text-terracotta hover:text-terracotta-deep underline underline-offset-2 transition-colors"
      >
        {showQuestions ? 'Masquer les questions' : `Questions (${lecture.nb_questions})`}
      </button>

      {showQuestions && (
        <div className="mt-3">
          {loadingQ ? (
            <p className="font-manrope text-xs text-ink-soft">Chargement…</p>
          ) : (
            <>
              {(questions ?? []).map(q => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  lectureId={lecture.id}
                  currentUserId={currentUserId}
                  onRepondu={loadQuestions}
                />
              ))}
              <PosterQuestion lectureId={lecture.id} onPostee={loadQuestions} />
            </>
          )}
        </div>
      )}
    </div>
  )
}
