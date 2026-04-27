'use client'

import { useState } from 'react'
import { deleteJournalEntree } from '@/app/actions/journal'
import EntreeEditor from './EntreeEditor'
import type { EntreeDechiffree } from '@/types/journal'

interface JournalOuvertProps {
  cryptoKey: CryptoKey
  entrees: EntreeDechiffree[]
  prenom: string
  onLock: () => void
}

function formatDateFR(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso + 'T12:00:00'))
}

export default function JournalOuvert({ cryptoKey, entrees: initialEntrees, prenom, onLock }: JournalOuvertProps) {
  const [entrees, setEntrees] = useState<EntreeDechiffree[]>(initialEntrees)
  const [vue, setVue] = useState<'liste' | 'ecrire' | 'lire'>('liste')
  const [selection, setSelection] = useState<EntreeDechiffree | null>(null)
  const [enEdition, setEnEdition] = useState<EntreeDechiffree | null>(null)

  function handleSaved(entree: EntreeDechiffree) {
    setEntrees(prev => {
      const exists = prev.find(e => e.id === entree.id)
      if (exists) return prev.map(e => e.id === entree.id ? entree : e)
      return [entree, ...prev]
    })
    setVue('liste')
    setEnEdition(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette entrée définitivement ?')) return
    await deleteJournalEntree(id)
    setEntrees(prev => prev.filter(e => e.id !== id))
    if (selection?.id === id) { setSelection(null); setVue('liste') }
  }

  if (vue === 'ecrire') {
    return (
      <EntreeEditor
        cryptoKey={cryptoKey}
        entree={enEdition ?? undefined}
        onSaved={handleSaved}
        onCancel={() => { setVue(selection ? 'lire' : 'liste'); setEnEdition(null) }}
      />
    )
  }

  if (vue === 'lire' && selection) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={() => { setVue('liste'); setSelection(null) }} className="font-manrope text-sm text-ink-soft hover:text-ink flex items-center gap-1">
            ← Retour
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => { setEnEdition(selection); setVue('ecrire') }}
              className="font-manrope text-sm text-azur hover:text-azur-deep"
            >
              Modifier
            </button>
            <button
              onClick={() => handleDelete(selection.id)}
              className="font-manrope text-sm text-red-400 hover:text-red-600"
            >
              Supprimer
            </button>
          </div>
        </div>

        <div className="bg-jasmine rounded-2xl p-5 border border-sand-warm">
          <p className="font-manrope text-xs text-ink-soft mb-1">{formatDateFR(selection.date)}</p>
          {selection.titre && (
            <h3 className="font-fraunces text-xl font-bold text-ink mb-3">{selection.titre}</h3>
          )}
          <p className="font-caveat text-lg text-ink leading-relaxed whitespace-pre-wrap">{selection.contenu}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-fraunces text-xl font-bold text-ink">📔 Journal de {prenom}</h2>
          <p className="font-manrope text-xs text-ink-soft">{entrees.length} entrée{entrees.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={onLock} className="font-manrope text-xs text-ink-soft hover:text-ink flex items-center gap-1">
          🔒 Verrouiller
        </button>
      </div>

      {/* Bouton nouvelle entrée */}
      <button
        onClick={() => { setEnEdition(null); setVue('ecrire') }}
        className="w-full border-2 border-dashed border-terracotta/40 rounded-2xl py-4 font-manrope text-sm text-terracotta hover:bg-terracotta/5 transition-colors flex items-center justify-center gap-2"
      >
        ✏️ Écrire une nouvelle page
      </button>

      {/* Liste des entrées */}
      {entrees.length === 0 ? (
        <p className="font-manrope text-ink-soft text-center py-8 text-sm">
          Ton journal est encore vide. Écris ta première page !
        </p>
      ) : (
        <div className="space-y-2">
          {entrees.map(e => (
            <button
              key={e.id}
              onClick={() => { setSelection(e); setVue('lire') }}
              className="w-full text-left bg-jasmine hover:bg-sand rounded-2xl p-4 border border-sand-warm transition-colors"
            >
              <p className="font-manrope text-xs text-ink-soft mb-0.5">{formatDateFR(e.date)}</p>
              {e.titre ? (
                <p className="font-fraunces text-base font-semibold text-ink">{e.titre}</p>
              ) : (
                <p className="font-caveat text-base text-ink line-clamp-2">{e.contenu}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
