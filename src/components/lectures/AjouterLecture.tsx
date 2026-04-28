// src/components/lectures/AjouterLecture.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import type { GoogleBooksResult } from '@/types/lecture'

// Sandra et Sarah uniquement — Papa n'a pas besoin de s'assigner à lui-même
const MEMBRES_ASSIGNABLES = [
  { id: '1a0967e9-91e0-48f6-a3da-752255274153', nom: 'Sandra' },
  { id: '617eff77-47ed-40e0-b784-c027183c9bee', nom: 'Sarah' },
]

interface Props {
  onCree: () => void
  onAnnuler: () => void
}

export default function AjouterLecture({ onCree, onAnnuler }: Props) {
  const [recherche, setRecherche] = useState('')
  const [resultats, setResultats] = useState<GoogleBooksResult[]>([])
  const [showResultats, setShowResultats] = useState(false)
  const [manuel, setManuel] = useState(false)
  const [titre, setTitre] = useState('')
  const [auteurLivre, setAuteurLivre] = useState('')
  const [description, setDescription] = useState('')
  const [couvertureUrl, setCouvertureUrl] = useState('')
  const [assignees, setAssignees] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!recherche.trim() || manuel) {
      setResultats([])
      setShowResultats(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await fetch(`/api/google-books?q=${encodeURIComponent(recherche)}`)
        if (res.ok) {
          const { results } = await res.json()
          setResultats(results)
          setShowResultats(results.length > 0)
        }
      } finally {
        setIsSearching(false)
      }
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [recherche, manuel])

  const handleSelectResultat = (r: GoogleBooksResult) => {
    setTitre(r.titre)
    setAuteurLivre(r.auteur)
    setDescription(r.description ?? '')
    setCouvertureUrl(r.couverture_url ?? '')
    setShowResultats(false)
    setManuel(true)
  }

  const toggleAssignee = (id: string) => {
    setAssignees(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id])
  }

  const handlePublier = async () => {
    if (!titre.trim() || !auteurLivre.trim()) return
    setIsLoading(true)
    setErreur(null)
    try {
      const res = await fetch('/api/lectures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titre: titre.trim(),
          auteur_livre: auteurLivre.trim(),
          description: description.trim() || undefined,
          couverture_url: couvertureUrl.trim() || undefined,
          assignees,
        }),
      })
      if (!res.ok) {
        const { error } = await res.json()
        setErreur(error ?? 'Erreur lors de l\'ajout')
        return
      }
      onCree()
    } catch {
      setErreur('Erreur réseau')
    } finally {
      setIsLoading(false)
    }
  }

  const canSubmit = titre.trim() && auteurLivre.trim()

  return (
    <div className="bg-jasmine rounded-3xl p-4 mb-4 border-2 border-terracotta/20">
      <h2 className="font-fraunces text-lg text-ink mb-3">Ajouter un livre</h2>

      {!manuel && (
        <div className="relative mb-2">
          <input
            type="text"
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            placeholder="Rechercher un livre…"
            aria-label="Rechercher un livre"
            className="w-full rounded-xl border border-terracotta/20 bg-cream px-3 py-2 font-manrope text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/40"
          />
          {isSearching && <p className="font-manrope text-xs text-ink-soft mt-1">Recherche…</p>}
          {showResultats && (
            <div className="absolute top-full left-0 right-0 z-10 bg-jasmine border border-terracotta/20 rounded-xl mt-1 overflow-hidden shadow-lg">
              {resultats.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectResultat(r)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-sand transition-colors text-left"
                >
                  {r.couverture_url && (
                    <img src={r.couverture_url} alt="" aria-hidden="true" className="w-8 h-11 object-cover rounded flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-manrope text-sm text-ink font-semibold truncate">{r.titre}</p>
                    <p className="font-manrope text-xs text-ink-soft truncate">{r.auteur}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {!manuel && (
        <button
          type="button"
          onClick={() => setManuel(true)}
          className="font-manrope text-xs text-terracotta underline underline-offset-2 mb-3 block"
        >
          Saisie manuelle
        </button>
      )}

      {manuel && (
        <div className="flex flex-col gap-2 mb-3">
          <input
            type="text"
            value={titre}
            onChange={e => setTitre(e.target.value)}
            placeholder="Titre du livre *"
            aria-label="Titre du livre"
            className="w-full rounded-xl border border-terracotta/20 bg-cream px-3 py-2 font-manrope text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/40"
          />
          <input
            type="text"
            value={auteurLivre}
            onChange={e => setAuteurLivre(e.target.value)}
            placeholder="Auteur *"
            aria-label="Auteur du livre"
            className="w-full rounded-xl border border-terracotta/20 bg-cream px-3 py-2 font-manrope text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/40"
          />
          <input
            type="url"
            value={couvertureUrl}
            onChange={e => setCouvertureUrl(e.target.value)}
            placeholder="URL de la couverture (optionnel)"
            aria-label="URL de la couverture"
            className="w-full rounded-xl border border-terracotta/20 bg-cream px-3 py-2 font-manrope text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/40"
          />
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Description (optionnel)"
            aria-label="Description du livre"
            rows={2}
            className="w-full rounded-xl border border-terracotta/20 bg-cream px-3 py-2 font-manrope text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/40 resize-none"
          />
        </div>
      )}

      <div className="mb-4">
        <p className="font-manrope text-xs text-ink-soft mb-2">Pour qui ?</p>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setAssignees([])}
            className={`px-3 py-1 rounded-full font-manrope text-xs font-semibold transition-all ${
              assignees.length === 0
                ? 'bg-terracotta text-white'
                : 'bg-cream text-ink-soft border border-terracotta/20 hover:border-terracotta/40'
            }`}
          >
            Tout le monde
          </button>
          {MEMBRES_ASSIGNABLES.map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => toggleAssignee(m.id)}
              className={`px-3 py-1 rounded-full font-manrope text-xs font-semibold transition-all ${
                assignees.includes(m.id)
                  ? 'bg-terracotta text-white'
                  : 'bg-cream text-ink-soft border border-terracotta/20 hover:border-terracotta/40'
              }`}
            >
              {m.nom}
            </button>
          ))}
        </div>
      </div>

      {erreur && <p role="alert" className="text-xs text-red-600 font-manrope mb-2">{erreur}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onAnnuler}
          className="flex-1 py-2 rounded-full border border-terracotta/20 font-manrope text-sm text-ink-soft hover:bg-sand transition-colors"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={handlePublier}
          disabled={isLoading || !canSubmit}
          className="flex-1 py-2 rounded-full bg-terracotta text-white font-manrope font-semibold text-sm hover:bg-terracotta-deep disabled:opacity-40 transition-colors"
        >
          {isLoading ? 'Ajout…' : 'Ajouter'}
        </button>
      </div>
    </div>
  )
}
