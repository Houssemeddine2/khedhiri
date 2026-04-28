'use client'

import { useState } from 'react'
import type { Vocal } from '@/types/calin'
import VoicePlayer from '@/components/timeline/VoicePlayer'
import VocalRecorder from './VocalRecorder'

interface Props {
  vocaux: Vocal[]
  onVocauxChange: () => void
}

export default function BibliothequeVocaux({ vocaux, onVocauxChange }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [titre, setTitre] = useState('')
  const [blob, setBlob] = useState<Blob | null>(null)
  const [dureeSec, setDureeSec] = useState<number>(0)
  const [isUploading, setIsUploading] = useState(false)

  const handleRecorded = (b: Blob, d: number) => {
    setBlob(b)
    setDureeSec(d)
  }

  const handleAjouter = async () => {
    if (!blob || !titre.trim()) return
    setIsUploading(true)

    const fd = new FormData()
    fd.append('audio', new File([blob], 'vocal.webm', { type: 'audio/webm' }))
    fd.append('titre', titre.trim())
    fd.append('duree_sec', String(dureeSec))

    const res = await fetch('/api/calins/vocaux', { method: 'POST', body: fd })
    setIsUploading(false)

    if (res.ok) {
      setShowForm(false)
      setTitre('')
      setBlob(null)
      setDureeSec(0)
      onVocauxChange()
    }
  }

  const handleSupprimer = async (id: string) => {
    const res = await fetch(`/api/calins/vocaux/${id}`, { method: 'DELETE' })
    if (res.ok) onVocauxChange()
  }

  return (
    <section aria-labelledby="biblio-titre">
      <h2 id="biblio-titre" className="font-fraunces text-xl text-ink mb-3">
        Ma bibliothèque de vocaux
      </h2>

      {vocaux.length === 0 && !showForm && (
        <p className="text-ink-soft font-manrope text-sm mb-3">
          Aucun vocal préparé pour l'instant.
        </p>
      )}

      <div className="flex flex-col gap-3 mb-4">
        {vocaux.map(v => (
          <div key={v.id} className="bg-jasmine rounded-2xl p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-manrope font-semibold text-ink text-sm">{v.titre}</span>
              <button
                onClick={() => handleSupprimer(v.id)}
                aria-label={`Supprimer « ${v.titre} »`}
                className="text-ink-soft hover:text-terracotta transition-colors text-xs"
              >
                🗑️
              </button>
            </div>
            <VoicePlayer url={v.vocal_url} duration={v.duree_sec} />
          </div>
        ))}
      </div>

      {showForm ? (
        <div className="bg-sand rounded-2xl p-4 flex flex-col gap-3">
          <VocalRecorder onRecorded={handleRecorded} />
          {blob && (
            <>
              <input
                type="text"
                value={titre}
                onChange={e => setTitre(e.target.value)}
                placeholder="Titre du vocal (ex : Bonne nuit)"
                aria-label="Titre du vocal"
                className="w-full rounded-xl border border-terracotta/20 bg-cream px-3 py-2 font-manrope text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/40"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAjouter}
                  disabled={isUploading || !titre.trim()}
                  className="flex-1 bg-terracotta text-white rounded-full py-2 font-manrope font-semibold text-sm disabled:opacity-40"
                >
                  {isUploading ? 'Enregistrement…' : 'Sauvegarder'}
                </button>
                <button
                  onClick={() => { setShowForm(false); setBlob(null); setTitre('') }}
                  className="px-4 py-2 rounded-full border border-terracotta/20 font-manrope text-sm text-ink-soft"
                >
                  Annuler
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-terracotta text-terracotta font-manrope font-semibold text-sm hover:bg-terracotta/10 transition-colors"
        >
          + Ajouter un vocal
        </button>
      )}
    </section>
  )
}
