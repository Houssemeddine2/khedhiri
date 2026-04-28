'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MEMBRES } from '@/lib/membres'
import type { LettrePapa } from '@/types/lettre'

const PAPA_ID = 'b6025d5f-77d5-4208-b489-bcc717ebc01c'
const FILLES = MEMBRES.filter(m => m.id !== PAPA_ID)

// Raccourcis 18 ans : Sandra 14 nov 2031, Sarah 14 déc 2035
const SHORTCUTS: Record<string, { label: string; value: string }> = {
  '1a0967e9-91e0-48f6-a3da-752255274153': { label: '18 ans de Sandra (14 nov 2031)', value: '2031-11-14T00:00' },
  '617eff77-47ed-40e0-b784-c027183c9bee': { label: '18 ans de Sarah (14 déc 2035)', value: '2035-12-14T00:00' },
}

interface LettreEditorProps {
  lettre?: LettrePapa
  onClose: () => void
}

export default function LettreEditor({ lettre, onClose }: LettreEditorProps) {
  const router = useRouter()
  const isEdit = !!lettre
  const [destinataireId, setDestinataire] = useState(lettre?.destinataire_id ?? FILLES[0].id)
  const [titre, setTitre] = useState(lettre?.titre ?? '')
  const [contenu, setContenu] = useState(lettre?.contenu ?? '')
  const [unlockAt, setUnlockAt] = useState(
    lettre ? lettre.unlock_at.slice(0, 16) : '',
  )
  const [isPending, setIsPending] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!titre.trim() || !contenu.trim()) { setErreur('Titre et contenu requis.'); return }
    if (!isEdit && !unlockAt) { setErreur('Date de déverrouillage requise.'); return }
    setErreur(null)
    setIsPending(true)
    try {
      let res: Response
      if (isEdit) {
        res = await fetch(`/api/lettres/${lettre.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ titre: titre.trim(), contenu: contenu.trim() }),
        })
      } else {
        res = await fetch('/api/lettres', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            destinataire_id: destinataireId,
            titre: titre.trim(),
            contenu: contenu.trim(),
            unlock_at: new Date(unlockAt).toISOString(),
          }),
        })
      }
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? 'Erreur inconnue')
      }
      router.refresh()
      onClose()
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur inconnue')
      setIsPending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="lettre-editor-titre">
      <div className="bg-jasmine rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 id="lettre-editor-titre" className="font-fraunces text-xl font-bold text-ink">
            {isEdit ? 'Modifier la lettre' : 'Écrire une lettre'}
          </h2>
          <button onClick={onClose} className="text-ink-soft hover:text-ink text-2xl leading-none" aria-label="Fermer">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {!isEdit && (
            <div>
              <label htmlFor="lettre-destinataire" className="block font-manrope text-sm font-semibold text-ink mb-1">Pour</label>
              <select
                id="lettre-destinataire"
                value={destinataireId}
                onChange={e => setDestinataire(e.target.value)}
                className="w-full border border-sand-warm rounded-lg px-3 py-2 font-manrope text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-terracotta"
              >
                {FILLES.map(f => (
                  <option key={f.id} value={f.id}>{f.nom}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block font-manrope text-sm font-semibold text-ink mb-1" htmlFor="lettre-titre">Titre</label>
            <input
              id="lettre-titre"
              type="text"
              value={titre}
              onChange={e => setTitre(e.target.value)}
              placeholder="Ex: Pour tes 18 ans..."
              className="w-full border border-sand-warm rounded-lg px-3 py-2 font-manrope text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-terracotta"
              required
            />
          </div>

          {!isEdit && (
            <div>
              <label htmlFor="lettre-unlock-at" className="block font-manrope text-sm font-semibold text-ink mb-1">Date de déverrouillage</label>
              {SHORTCUTS[destinataireId] && (
                <button
                  type="button"
                  onClick={() => setUnlockAt(SHORTCUTS[destinataireId].value)}
                  className="mb-2 px-3 py-1 rounded-full text-xs font-manrope bg-sand hover:bg-sand-warm text-ink border border-sand-warm transition-colors"
                >
                  {SHORTCUTS[destinataireId].label}
                </button>
              )}
              <input
                id="lettre-unlock-at"
                type="datetime-local"
                value={unlockAt}
                onChange={e => setUnlockAt(e.target.value)}
                className="w-full border border-sand-warm rounded-lg px-3 py-2 font-manrope text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-terracotta"
                required
              />
            </div>
          )}

          {isEdit && (
            <p className="font-manrope text-xs text-ink-soft bg-sand rounded-lg px-3 py-2">
              🔒 Date de déverrouillage : {new Date(lettre.unlock_at).toLocaleDateString('fr-FR', { dateStyle: 'long' })} — non modifiable
            </p>
          )}

          <div>
            <label className="block font-manrope text-sm font-semibold text-ink mb-1" htmlFor="lettre-contenu">Ta lettre</label>
            <textarea
              id="lettre-contenu"
              value={contenu}
              onChange={e => setContenu(e.target.value)}
              rows={8}
              placeholder="Écris ici ta lettre avec tout l'amour que tu veux..."
              className="w-full border border-sand-warm rounded-lg px-3 py-2 font-manrope text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-terracotta resize-none"
              required
            />
          </div>

          {erreur && <p className="font-manrope text-sm text-red-600">{erreur}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 rounded-xl border border-sand-warm font-manrope text-sm text-ink-soft hover:bg-sand transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={isPending}
              className="flex-1 py-2 rounded-xl bg-terracotta text-white font-manrope text-sm font-semibold hover:bg-terracotta-deep transition-colors disabled:opacity-50">
              {isPending
                ? (isEdit ? 'Modification...' : 'Envoi...')
                : (isEdit ? 'Modifier' : 'Sceller la lettre 📜')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
