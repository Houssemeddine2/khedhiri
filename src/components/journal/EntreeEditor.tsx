'use client'

import { useState, useTransition } from 'react'
import { encrypt } from '@/lib/journal-crypto'
import { createJournalEntree, updateJournalEntree } from '@/app/actions/journal'
import type { EntreeDechiffree } from '@/types/journal'

interface EntreeEditorProps {
  cryptoKey: CryptoKey
  entree?: EntreeDechiffree   // si présente = édition, sinon = création
  onSaved: (entree: EntreeDechiffree) => void
  onCancel: () => void
}

function dateAujourdhuiISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function EntreeEditor({ cryptoKey, entree, onSaved, onCancel }: EntreeEditorProps) {
  const [titre,   setTitre]   = useState(entree?.titre   ?? '')
  const [contenu, setContenu] = useState(entree?.contenu ?? '')
  const [date,    setDate]    = useState(entree?.date     ?? dateAujourdhuiISO())
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    if (!contenu.trim()) return
    startTransition(async () => {
      const contenuCipher = await encrypt(cryptoKey, contenu)
      const titreCipher   = titre.trim() ? await encrypt(cryptoKey, titre) : null

      const id = entree?.id ?? crypto.randomUUID()

      if (entree) {
        await updateJournalEntree(entree.id, contenuCipher, titreCipher)
      } else {
        await createJournalEntree(contenuCipher, titreCipher, date)
      }

      onSaved({
        id,
        titre: titre.trim(),
        contenu,
        date,
        created_at: entree?.created_at ?? new Date().toISOString(),
      })
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-fraunces text-lg font-bold text-ink">
          {entree ? 'Modifier l\'entrée' : 'Nouvelle entrée'}
        </h3>
        <button onClick={onCancel} className="font-manrope text-ink-soft text-sm hover:text-ink">
          Annuler
        </button>
      </div>

      <div>
        <label htmlFor="entree-date" className="font-manrope text-xs font-semibold text-ink-soft block mb-1">
          Date
        </label>
        <input
          id="entree-date"
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="rounded-xl border border-sand-warm bg-jasmine px-3 py-2 font-manrope text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta"
        />
      </div>

      <div>
        <label htmlFor="entree-titre" className="font-manrope text-xs font-semibold text-ink-soft block mb-1">
          Titre (facultatif)
        </label>
        <input
          id="entree-titre"
          type="text"
          value={titre}
          onChange={e => setTitre(e.target.value)}
          placeholder="Donne un titre à ta page…"
          maxLength={120}
          className="w-full rounded-xl border border-sand-warm bg-jasmine px-3 py-2 font-caveat text-base text-ink placeholder:text-ink-soft/60 focus:outline-none focus:ring-2 focus:ring-terracotta"
        />
      </div>

      <div>
        <label htmlFor="entree-contenu" className="font-manrope text-xs font-semibold text-ink-soft block mb-1">
          Ce que tu ressens aujourd&apos;hui
        </label>
        <textarea
          id="entree-contenu"
          value={contenu}
          onChange={e => setContenu(e.target.value)}
          placeholder="Écris tout ce que tu veux… Personne d'autre ne lira tes mots."
          rows={10}
          className="w-full rounded-xl border border-sand-warm bg-jasmine px-3 py-3 font-caveat text-base text-ink placeholder:text-ink-soft/50 focus:outline-none focus:ring-2 focus:ring-terracotta resize-none leading-relaxed"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={isPending || !contenu.trim()}
        className="w-full bg-terracotta text-white font-manrope font-semibold py-3 rounded-xl hover:bg-terracotta-deep transition-colors disabled:opacity-50"
      >
        {isPending ? 'Chiffrement et sauvegarde…' : 'Sauvegarder 🔒'}
      </button>

      <p className="font-manrope text-xs text-ink-soft text-center">
        Ton texte est chiffré dans ton navigateur avant d&apos;être envoyé.
      </p>
    </div>
  )
}
