'use client'

import { useState } from 'react'
import { deriveKey, verifyKey } from '@/lib/journal-crypto'

interface DeverrouillerJournalProps {
  prenom: string
  salt: string
  checkCipher: string
  indice: string | null
  onUnlocked: (key: CryptoKey) => void
}

export default function DeverrouillerJournal({ prenom, salt, checkCipher, indice, onUnlocked }: DeverrouillerJournalProps) {
  const [mdp, setMdp]       = useState('')
  const [erreur, setErreur] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErreur('')
    setLoading(true)
    try {
      const key = await deriveKey(mdp, salt)
      const ok  = await verifyKey(key, checkCipher)
      if (ok) {
        onUnlocked(key)
      } else {
        setErreur('Mot de passe incorrect. Réessaie.')
      }
    } catch {
      setErreur('Une erreur est survenue. Réessaie.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className="text-6xl">🔒</div>
      <div className="text-center">
        <h2 className="font-fraunces text-2xl font-bold text-ink">
          Journal de {prenom}
        </h2>
        <p className="font-manrope text-ink-soft text-sm mt-1">
          Entre ton mot de passe secret pour ouvrir ton journal.
        </p>
      </div>

      {indice && (
        <div className="w-full max-w-sm bg-jasmine rounded-2xl px-4 py-3 border border-gold/20">
          <p className="font-manrope text-xs text-ink-soft mb-0.5">Ton indice :</p>
          <p className="font-caveat text-base text-ink">{indice}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div>
          <label htmlFor="mdp-unlock" className="font-manrope text-sm font-semibold text-ink block mb-1">
            Mot de passe secret
          </label>
          <input
            id="mdp-unlock"
            type="password"
            value={mdp}
            onChange={e => { setMdp(e.target.value); setErreur('') }}
            placeholder="Ton mot de passe…"
            autoComplete="current-password"
            autoFocus
            required
            className="w-full rounded-xl border border-sand-warm bg-white px-3 py-2.5 font-manrope text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta"
          />
        </div>

        {erreur && (
          <p className="font-manrope text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{erreur}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-terracotta text-white font-manrope font-semibold py-3 rounded-xl hover:bg-terracotta-deep transition-colors disabled:opacity-50"
        >
          {loading ? 'Vérification…' : 'Ouvrir mon journal 🔓'}
        </button>
      </form>
    </div>
  )
}
