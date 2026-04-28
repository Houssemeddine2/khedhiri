'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Lecture } from '@/types/lecture'
import LectureCard from './LectureCard'
import AjouterLecture from './AjouterLecture'

interface Props {
  userId: string
}

export default function LecturesSection({ userId }: Props) {
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [showAjouter, setShowAjouter] = useState(false)
  const [erreurChargement, setErreurChargement] = useState<string | null>(null)

  const loadLectures = useCallback(async () => {
    const res = await fetch('/api/lectures')
    if (res.ok) {
      const { lectures: data } = await res.json()
      setLectures(data)
      setErreurChargement(null)
    } else {
      setErreurChargement('Impossible de charger les lectures')
    }
  }, [])

  useEffect(() => { loadLectures() }, [loadLectures])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-fraunces text-xl text-ink">Lectures 📚</h2>
        <button
          type="button"
          onClick={() => setShowAjouter(v => !v)}
          className="px-4 py-2 rounded-full bg-terracotta text-white font-manrope font-semibold text-sm hover:bg-terracotta-deep transition-colors"
        >
          {showAjouter ? 'Annuler' : '+ Ajouter'}
        </button>
      </div>

      {showAjouter && (
        <AjouterLecture
          onCree={() => { setShowAjouter(false); loadLectures() }}
          onAnnuler={() => setShowAjouter(false)}
        />
      )}

      {erreurChargement && (
        <p role="alert" className="font-manrope text-sm text-red-600 text-center mb-4">{erreurChargement}</p>
      )}

      {lectures.length === 0 && !showAjouter && !erreurChargement ? (
        <p className="font-caveat text-center text-ink-soft text-xl">
          Pas encore de lecture… proposez un livre ! 📚
        </p>
      ) : (
        lectures.map(l => (
          <LectureCard key={l.id} lecture={l} currentUserId={userId} onUpdated={loadLectures} />
        ))
      )}
    </div>
  )
}
