'use client'

import { useState } from 'react'
import type { Vocal } from '@/types/calin'
import { MEMBRES } from '@/lib/membres'
import { avatarFromEmail } from '@/lib/avatar'
import VoicePlayer from '@/components/timeline/VoicePlayer'
import VocalRecorder from './VocalRecorder'

interface Props {
  userId: string
  vocaux: Vocal[]
  onCalinEnvoye: () => void
}

export default function EnvoyerCalin({ userId, vocaux, onCalinEnvoye }: Props) {
  const autresMembres = MEMBRES.filter(m => m.id !== userId)

  const [destinataireId, setDestinataireId] = useState('')
  const [vocalSelectionne, setVocalSelectionne] = useState<Vocal | null>(null)
  const [mode, setMode] = useState<'bibliotheque' | 'nouveau'>('bibliotheque')
  const [blob, setBlob] = useState<Blob | null>(null)
  const [dureeSec, setDureeSec] = useState<number>(0)
  const [titre, setTitre] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const handleRecorded = (b: Blob, d: number) => {
    setBlob(b)
    setDureeSec(d)
  }

  const handleModeChange = (m: 'bibliotheque' | 'nouveau') => {
    setMode(m)
    setBlob(null)
    setDureeSec(0)
    setTitre('')
  }

  const canSend = destinataireId !== '' && (
    (mode === 'bibliotheque' && vocalSelectionne !== null) ||
    (mode === 'nouveau' && blob !== null && titre.trim() !== '')
  )

  const handleEnvoyer = async () => {
    if (!canSend) return
    setIsLoading(true)
    setErreur(null)
    try {
      const fd = new FormData()
      fd.append('destinataire_id', destinataireId)
      if (mode === 'bibliotheque' && vocalSelectionne) {
        fd.append('titre', vocalSelectionne.titre)
        fd.append('vocal_id', vocalSelectionne.id)
      } else if (mode === 'nouveau' && blob) {
        fd.append('titre', titre.trim())
        fd.append('audio', new File([blob], 'vocal.webm', { type: 'audio/webm' }))
        fd.append('duree_sec', String(dureeSec))
      }
      const res = await fetch('/api/calins', { method: 'POST', body: fd })
      if (res.ok) {
        setSent(true)
        setTimeout(() => {
          setSent(false)
          setDestinataireId('')
          setVocalSelectionne(null)
          setBlob(null)
          setTitre('')
          setMode('bibliotheque')
        }, 2000)
        onCalinEnvoye()
      } else {
        const data = await res.json().catch(() => ({}))
        setErreur(data.error ?? 'Erreur lors de l\'envoi')
      }
    } catch {
      setErreur('Impossible de contacter le serveur')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section aria-labelledby="envoi-titre">
      <h2 id="envoi-titre" className="font-fraunces text-xl text-ink mb-3">
        Envoyer un câlin
      </h2>

      {/* Sélecteur destinataire */}
      <div className="flex gap-3 mb-4">
        {autresMembres.map(m => {
          const av = avatarFromEmail(m.email)
          const selected = destinataireId === m.id
          return (
            <button
              key={m.id}
              onClick={() => setDestinataireId(m.id)}
              aria-label={`Envoyer à ${av.nom}`}
              aria-pressed={selected}
              className={`flex flex-col items-center gap-1 px-4 py-3 rounded-2xl border-2 transition-all font-manrope text-sm font-semibold ${
                selected
                  ? 'border-terracotta bg-terracotta/10 text-terracotta'
                  : 'border-terracotta/20 text-ink-soft hover:border-terracotta/40'
              }`}
            >
              <div className={`w-10 h-10 rounded-full ${av.couleurBg} flex items-center justify-center text-white font-bold text-lg`}>
                {av.initiale}
              </div>
              {av.nom}
            </button>
          )
        })}
      </div>

      {/* Choix mode */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => handleModeChange('bibliotheque')}
          aria-pressed={mode === 'bibliotheque'}
          className={`px-3 py-1.5 rounded-full font-manrope text-sm font-semibold transition-all ${
            mode === 'bibliotheque'
              ? 'bg-terracotta text-white'
              : 'bg-sand text-ink-soft hover:bg-sand-warm'
          }`}
        >
          Ma bibliothèque
        </button>
        <button
          onClick={() => handleModeChange('nouveau')}
          aria-pressed={mode === 'nouveau'}
          className={`px-3 py-1.5 rounded-full font-manrope text-sm font-semibold transition-all ${
            mode === 'nouveau'
              ? 'bg-terracotta text-white'
              : 'bg-sand text-ink-soft hover:bg-sand-warm'
          }`}
        >
          Enregistrer maintenant
        </button>
      </div>

      {/* Mode bibliothèque */}
      {mode === 'bibliotheque' && (
        <div className="flex flex-col gap-2 mb-4">
          {vocaux.length === 0 ? (
            <p className="text-ink-soft font-manrope text-sm">
              Ta bibliothèque est vide — enregistre des vocaux ci-dessous d'abord.
            </p>
          ) : (
            <div role="radiogroup" aria-label="Choisir un vocal" className="flex flex-col gap-2">
              {vocaux.map(v => (
                <div
                  key={v.id}
                  role="radio"
                  aria-checked={vocalSelectionne?.id === v.id}
                  tabIndex={0}
                  onClick={() => setVocalSelectionne(v)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setVocalSelectionne(v) } }}
                  className={`rounded-2xl border-2 p-3 cursor-pointer transition-all ${
                    vocalSelectionne?.id === v.id
                      ? 'border-terracotta bg-terracotta/10'
                      : 'border-terracotta/20 bg-jasmine hover:border-terracotta/40'
                  }`}
                >
                  <p className="font-manrope font-semibold text-sm text-ink mb-2">{v.titre}</p>
                  <VoicePlayer url={v.vocal_url} duration={v.duree_sec} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mode nouveau */}
      {mode === 'nouveau' && (
        <div className="flex flex-col gap-3 mb-4">
          <VocalRecorder onRecorded={handleRecorded} />
          {blob && (
            <>
              <input
                type="text"
                value={titre}
                onChange={e => setTitre(e.target.value)}
                placeholder="Titre du message (ex : Je t'aime fort)"
                aria-label="Titre du câlin"
                className="w-full rounded-xl border border-terracotta/20 bg-cream px-3 py-2 font-manrope text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/40"
              />
            </>
          )}
        </div>
      )}

      {/* Région live pour l'annonce d'envoi */}
      <p aria-live="polite" aria-atomic="true" className="sr-only">
        {sent ? 'Câlin envoyé avec succès' : ''}
      </p>

      {/* Affichage erreur */}
      {erreur && (
        <p role="alert" className="text-xs text-terracotta font-manrope mb-2">{erreur}</p>
      )}

      {/* Bouton envoi */}
      <button
        onClick={handleEnvoyer}
        disabled={!canSend || isLoading || sent}
        className={`w-full py-3 rounded-full font-manrope font-bold text-base transition-all ${
          sent
            ? 'bg-olive text-white'
            : 'bg-terracotta text-white hover:bg-terracotta-deep disabled:opacity-40'
        }`}
      >
        {sent ? '🤗 Câlin envoyé !' : isLoading ? 'Envoi…' : 'Envoyer le câlin 🤗'}
      </button>
    </section>
  )
}
