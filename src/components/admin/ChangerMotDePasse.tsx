'use client'

import { useState } from 'react'
import { MEMBRES } from '@/lib/membres'

const MEMBRES_AVEC_MDP = MEMBRES.map(m => ({
  id: m.id,
  nom: m.nom,
  email: m.email,
}))

export default function ChangerMotDePasse() {
  const [userId, setUserId]       = useState(MEMBRES_AVEC_MDP[0].id)
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [loading, setLoading]     = useState(false)
  const [message, setMessage]     = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [showPwd, setShowPwd]     = useState(false)

  const membre = MEMBRES_AVEC_MDP.find(m => m.id === userId)!

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)

    if (password.length < 8) {
      setMessage({ type: 'err', text: 'Le mot de passe doit faire au moins 8 caractères.' })
      return
    }
    if (password !== confirm) {
      setMessage({ type: 'err', text: 'Les deux mots de passe ne correspondent pas.' })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newPassword: password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage({ type: 'err', text: data.error ?? 'Erreur inconnue' })
      } else {
        setMessage({ type: 'ok', text: `Mot de passe de ${membre.nom} modifié avec succès.` })
        setPassword('')
        setConfirm('')
      }
    } catch {
      setMessage({ type: 'err', text: 'Erreur réseau.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <h2 className="font-fraunces italic text-terracotta text-xl mb-4 flex items-center gap-2">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        Changer un mot de passe
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Sélection du compte */}
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Compte</label>
          <div className="flex gap-2 flex-wrap">
            {MEMBRES_AVEC_MDP.map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => { setUserId(m.id); setMessage(null) }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors min-h-[44px] ${
                  userId === m.id
                    ? 'bg-terracotta text-white border-terracotta'
                    : 'bg-sand text-ink-soft border-sand-warm hover:bg-sand-warm'
                }`}
              >
                {m.nom}
              </button>
            ))}
          </div>
          <p className="text-xs text-ink-soft mt-1">{membre.email}</p>
        </div>

        {/* Nouveau mot de passe */}
        <div>
          <label htmlFor="new-pwd" className="block text-sm font-medium text-ink mb-1.5">
            Nouveau mot de passe
          </label>
          <div className="relative">
            <input
              id="new-pwd"
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min. 8 caractères"
              className="w-full px-4 py-2.5 rounded-xl border border-sand-warm bg-sand/30 text-ink placeholder-ink-soft/50 focus:outline-none focus:ring-2 focus:ring-terracotta/30 pr-10"
              minLength={8}
              required
            />
            <button
              type="button"
              onClick={() => setShowPwd(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
              aria-label={showPwd ? 'Masquer' : 'Afficher'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {showPwd
                  ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
                  : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                }
              </svg>
            </button>
          </div>
        </div>

        {/* Confirmation */}
        <div>
          <label htmlFor="confirm-pwd" className="block text-sm font-medium text-ink mb-1.5">
            Confirmer le mot de passe
          </label>
          <input
            id="confirm-pwd"
            type={showPwd ? 'text' : 'password'}
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Répéter le mot de passe"
            className="w-full px-4 py-2.5 rounded-xl border border-sand-warm bg-sand/30 text-ink placeholder-ink-soft/50 focus:outline-none focus:ring-2 focus:ring-terracotta/30"
            minLength={8}
            required
          />
        </div>

        {/* Message */}
        {message && (
          <div className={`px-4 py-3 rounded-xl text-sm font-medium ${
            message.type === 'ok'
              ? 'bg-olive/10 text-olive border border-olive/20'
              : 'bg-red-50 text-red-600 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-terracotta text-white font-semibold hover:bg-terracotta-deep transition-colors disabled:opacity-50 min-h-[44px]"
        >
          {loading ? 'Modification…' : `Modifier le mot de passe de ${membre.nom}`}
        </button>
      </form>
    </div>
  )
}
