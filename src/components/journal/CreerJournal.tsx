'use client'

import { useState, useTransition } from 'react'
import { createJournalProfil } from '@/app/actions/journal'
import { generateSalt, deriveKey, buildCheckCipher } from '@/lib/journal-crypto'

interface CreerJournalProps {
  prenom: string
  onCreated: () => void
}

export default function CreerJournal({ prenom, onCreated }: CreerJournalProps) {
  const [mdp, setMdp]       = useState('')
  const [confirm, setConfirm] = useState('')
  const [indice, setIndice]   = useState('')
  const [erreur, setErreur]   = useState('')
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErreur('')

    if (mdp.length < 4) {
      setErreur('Le mot de passe doit avoir au moins 4 caractères.')
      return
    }
    if (mdp !== confirm) {
      setErreur('Les deux mots de passe ne correspondent pas.')
      return
    }

    startTransition(async () => {
      const salt = generateSalt()
      const key  = await deriveKey(mdp, salt)
      const check = await buildCheckCipher(key)
      await createJournalProfil(salt, check, indice || undefined)
      onCreated()
    })
  }

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className="text-6xl">📔</div>
      <div className="text-center">
        <h2 className="font-fraunces text-2xl font-bold text-ink">
          Mon journal secret
        </h2>
        <p className="font-manrope text-ink-soft text-sm mt-1 max-w-xs">
          Choisie un mot de passe secret. <strong>Personne d&apos;autre ne pourra lire ton journal</strong> — même Papa.
        </p>
      </div>

      <div className="w-full max-w-sm bg-jasmine rounded-2xl p-4 border border-gold/20 text-sm font-manrope text-amber-800 leading-relaxed">
        ⚠️ <strong>Important :</strong> si tu oublies ce mot de passe, ton journal sera impossible à retrouver. Note-le quelque part de sûr !
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div>
          <label htmlFor="mdp-new" className="font-manrope text-sm font-semibold text-ink block mb-1">
            Mot de passe secret
          </label>
          <input
            id="mdp-new"
            type="password"
            value={mdp}
            onChange={e => setMdp(e.target.value)}
            placeholder="Au moins 4 caractères"
            autoComplete="new-password"
            required
            className="w-full rounded-xl border border-sand-warm bg-white px-3 py-2.5 font-manrope text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta"
          />
        </div>

        <div>
          <label htmlFor="mdp-confirm" className="font-manrope text-sm font-semibold text-ink block mb-1">
            Confirme ton mot de passe
          </label>
          <input
            id="mdp-confirm"
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Répète le même mot de passe"
            autoComplete="new-password"
            required
            className="w-full rounded-xl border border-sand-warm bg-white px-3 py-2.5 font-manrope text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta"
          />
        </div>

        <div>
          <label htmlFor="indice" className="font-manrope text-sm font-semibold text-ink block mb-1">
            Indice (facultatif)
          </label>
          <input
            id="indice"
            type="text"
            value={indice}
            onChange={e => setIndice(e.target.value)}
            placeholder="Ex : ma couleur préférée + mon âge"
            className="w-full rounded-xl border border-sand-warm bg-white px-3 py-2.5 font-manrope text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta"
          />
          <p className="font-manrope text-xs text-ink-soft mt-1">Cet indice sera visible mais ne révèle pas ton mot de passe.</p>
        </div>

        {erreur && (
          <p className="font-manrope text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{erreur}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-terracotta text-white font-manrope font-semibold py-3 rounded-xl hover:bg-terracotta-deep transition-colors disabled:opacity-50"
        >
          {isPending ? 'Création en cours…' : `Créer le journal de ${prenom} 📔`}
        </button>
      </form>
    </div>
  )
}
