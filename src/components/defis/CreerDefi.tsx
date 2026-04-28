'use client'

import { useState } from 'react'

interface Props {
  onCree: () => void
  onAnnuler: () => void
}

export default function CreerDefi({ onCree, onAnnuler }: Props) {
  const [type, setType] = useState<'defi' | 'mot'>('defi')
  const [contenu, setContenu] = useState('')
  const [traductionAr, setTraductionAr] = useState('')
  const [indice, setIndice] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const handleTypeChange = (t: 'defi' | 'mot') => {
    setType(t)
    setContenu('')
    setTraductionAr('')
    setIndice('')
    setErreur(null)
  }

  const handlePublier = async () => {
    if (!contenu.trim()) return
    if (type === 'mot' && !traductionAr.trim()) return
    setIsLoading(true)
    setErreur(null)
    try {
      const res = await fetch('/api/defis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          contenu: contenu.trim(),
          traduction_ar: type === 'mot' ? traductionAr.trim() : undefined,
          indice: indice.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const { error } = await res.json()
        setErreur(error ?? 'Erreur lors de la création')
        return
      }
      onCree()
    } catch {
      setErreur('Erreur réseau')
    } finally {
      setIsLoading(false)
    }
  }

  const canSubmit = contenu.trim() && (type !== 'mot' || traductionAr.trim())

  return (
    <div className="bg-jasmine rounded-3xl p-4 mb-4 border-2 border-terracotta/20">
      <h2 className="font-fraunces text-lg text-ink mb-3">Créer un défi</h2>

      <div className="flex gap-2 mb-4" role="radiogroup" aria-label="Type de contenu">
        {(['defi', 'mot'] as const).map(t => (
          <button
            key={t}
            role="radio"
            aria-checked={type === t}
            onClick={() => handleTypeChange(t)}
            className={`flex-1 py-2 rounded-full font-manrope font-semibold text-sm transition-all ${
              type === t
                ? 'bg-terracotta text-white'
                : 'bg-cream text-ink-soft border border-terracotta/20 hover:border-terracotta/40'
            }`}
          >
            {t === 'defi' ? '🎯 Défi' : '🔤 Mot bilingue'}
          </button>
        ))}
      </div>

      {type === 'defi' ? (
        <textarea
          value={contenu}
          onChange={e => setContenu(e.target.value)}
          placeholder="Décris le défi… (ex: Dessine un souvenir de cette semaine)"
          rows={3}
          aria-label="Description du défi"
          className="w-full rounded-xl border border-terracotta/20 bg-cream px-3 py-2 font-manrope text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/40 resize-none mb-3"
        />
      ) : (
        <div className="flex flex-col gap-2 mb-3">
          <input
            type="text"
            value={contenu}
            onChange={e => setContenu(e.target.value)}
            placeholder="Mot en français (ex: papillon)"
            aria-label="Mot en français"
            className="w-full rounded-xl border border-terracotta/20 bg-cream px-3 py-2 font-manrope text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/40"
          />
          <input
            type="text"
            value={traductionAr}
            onChange={e => setTraductionAr(e.target.value)}
            placeholder="Traduction en arabe"
            aria-label="Traduction en arabe"
            dir="auto"
            className="w-full rounded-xl border border-terracotta/20 bg-cream px-3 py-2 font-manrope text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/40"
          />
          <input
            type="text"
            value={indice}
            onChange={e => setIndice(e.target.value)}
            placeholder="Indice (optionnel)"
            aria-label="Indice optionnel"
            className="w-full rounded-xl border border-terracotta/20 bg-cream px-3 py-2 font-manrope text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/40"
          />
        </div>
      )}

      {erreur && <p role="alert" className="text-xs text-red-600 font-manrope mb-2">{erreur}</p>}

      <div className="flex gap-2">
        <button
          onClick={onAnnuler}
          className="flex-1 py-2 rounded-full border border-terracotta/20 font-manrope text-sm text-ink-soft hover:bg-sand transition-colors"
        >
          Annuler
        </button>
        <button
          onClick={handlePublier}
          disabled={isLoading || !canSubmit}
          className="flex-1 py-2 rounded-full bg-terracotta text-white font-manrope font-semibold text-sm hover:bg-terracotta-deep disabled:opacity-40 transition-colors"
        >
          {isLoading ? 'Publication…' : 'Publier'}
        </button>
      </div>
    </div>
  )
}
