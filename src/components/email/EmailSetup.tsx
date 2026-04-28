'use client'

import { useState } from 'react'

interface EmailSetupProps {
  onConfigured: () => void
}

export default function EmailSetup({ onConfigured }: EmailSetupProps) {
  const [password, setPassword] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password.trim()) { setErreur('Le mot de passe est requis.'); return }
    setErreur(null)
    setIsPending(true)
    try {
      const res = await fetch('/api/email/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? 'Erreur inconnue')
      }
      onConfigured()
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur inconnue')
      setIsPending(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="font-fraunces text-2xl font-bold text-ink mb-2">Ma boîte mail ✉️</h1>
      <p className="font-manrope text-sm text-ink-soft mb-6">
        Entre le mot de passe de ton adresse @khedhiri.me. Il sera sauvegardé une seule fois.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-manrope text-sm font-semibold text-ink mb-1" htmlFor="email-password">
            Mot de passe email
          </label>
          <input
            id="email-password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border border-sand-warm rounded-lg px-3 py-2 font-manrope text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-terracotta"
            autoComplete="current-password"
            required
          />
        </div>
        {erreur && <p className="font-manrope text-sm text-red-600">{erreur}</p>}
        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3 rounded-xl bg-terracotta text-white font-manrope text-sm font-semibold hover:bg-terracotta-deep transition-colors disabled:opacity-50"
        >
          {isPending ? 'Connexion...' : 'Configurer ma boîte ✉️'}
        </button>
      </form>
    </div>
  )
}
