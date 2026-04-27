'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Creation } from '@/types/creation'
import { uploadFichierSouvenir, ajouterSouvenir } from '@/app/actions/memoire'

interface AjouterSouvenirProps {
  creations: Creation[]
  onClose: () => void
}

export default function AjouterSouvenir({ creations, onClose }: AjouterSouvenirProps) {
  const router = useRouter()
  const [titre, setTitre] = useState('')
  const [texte, setTexte] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [creationId, setCreationId] = useState<string>('')
  const [isPending, setIsPending] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!titre.trim()) { setErreur('Le titre est obligatoire.'); return }
    setErreur(null)
    setIsPending(true)

    try {
      let photoUrl: string | undefined
      let audioUrl: string | undefined

      if (photoFile) {
        const fd = new FormData(); fd.append('file', photoFile)
        photoUrl = await uploadFichierSouvenir(fd, 'photo')
      }
      if (audioFile) {
        const fd = new FormData(); fd.append('file', audioFile)
        audioUrl = await uploadFichierSouvenir(fd, 'audio')
      }

      await ajouterSouvenir({
        titre,
        texte: texte || undefined,
        photoUrl,
        audioUrl,
        creationId: creationId || undefined,
        dateSouvenir: date,
      })
      router.refresh()
      onClose()
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur inconnue')
      setIsPending(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-jasmine rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-fraunces text-xl font-bold text-ink">Nouveau souvenir</h2>
          <button onClick={onClose} className="text-ink-soft hover:text-ink text-2xl" aria-label="Fermer">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-manrope text-sm font-semibold text-ink mb-1" htmlFor="titre">Titre *</label>
            <input
              id="titre"
              type="text"
              value={titre}
              onChange={e => setTitre(e.target.value)}
              placeholder="Ex: Premier Aïd ensemble à Tunis"
              className="w-full border border-sand-warm rounded-lg px-3 py-2 font-manrope text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-terracotta"
              required
            />
          </div>

          <div>
            <label className="block font-manrope text-sm font-semibold text-ink mb-1" htmlFor="date">Date</label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full border border-sand-warm rounded-lg px-3 py-2 font-manrope text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-terracotta"
            />
          </div>

          <div>
            <label className="block font-manrope text-sm font-semibold text-ink mb-1" htmlFor="texte">Texte (optionnel)</label>
            <textarea
              id="texte"
              value={texte}
              onChange={e => setTexte(e.target.value)}
              rows={3}
              placeholder="Raconte ce moment..."
              className="w-full border border-sand-warm rounded-lg px-3 py-2 font-manrope text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-terracotta resize-none"
            />
          </div>

          <div>
            <label className="block font-manrope text-sm font-semibold text-ink mb-1" htmlFor="photo">Photo (optionnel)</label>
            <input
              id="photo"
              type="file"
              accept="image/*"
              onChange={e => setPhotoFile(e.target.files?.[0] ?? null)}
              className="w-full font-manrope text-sm text-ink"
            />
          </div>

          <div>
            <label className="block font-manrope text-sm font-semibold text-ink mb-1" htmlFor="audio">Audio (optionnel)</label>
            <input
              id="audio"
              type="file"
              accept="audio/*"
              onChange={e => setAudioFile(e.target.files?.[0] ?? null)}
              className="w-full font-manrope text-sm text-ink"
            />
          </div>

          {creations.length > 0 && (
            <div>
              <label className="block font-manrope text-sm font-semibold text-ink mb-1" htmlFor="dessin">Dessin de l'atelier (optionnel)</label>
              <select
                id="dessin"
                value={creationId}
                onChange={e => setCreationId(e.target.value)}
                className="w-full border border-sand-warm rounded-lg px-3 py-2 font-manrope text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-terracotta"
              >
                <option value="">Aucun</option>
                {creations.map(c => (
                  <option key={c.id} value={c.id}>{c.title ?? `Création du ${new Date(c.created_at).toLocaleDateString('fr-FR')}`}</option>
                ))}
              </select>
            </div>
          )}

          {erreur && <p className="font-manrope text-sm text-red-600">{erreur}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl border border-sand-warm font-manrope text-sm text-ink-soft hover:bg-sand transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2 rounded-xl bg-terracotta text-white font-manrope text-sm font-semibold hover:bg-terracotta-deep transition-colors disabled:opacity-50"
            >
              {isPending ? 'Enregistrement...' : 'Ajouter ✨'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
