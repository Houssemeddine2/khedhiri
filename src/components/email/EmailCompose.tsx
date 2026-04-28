'use client'

import { useState } from 'react'

interface EmailComposeProps {
  isPapa: boolean
  defaultTo?: string
  defaultSubject?: string
  onSent: () => void
  onCancel: () => void
}

export default function EmailCompose({ isPapa, defaultTo = '', defaultSubject = '', onSent, onCancel }: EmailComposeProps) {
  const [to, setTo] = useState(defaultTo)
  const [subject, setSubject] = useState(defaultSubject)
  const [body, setBody] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!to.trim() || !subject.trim() || !body.trim()) {
      setErreur('Tous les champs sont requis.')
      return
    }
    setErreur(null)
    setIsPending(true)
    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: to.trim(), subject: subject.trim(), body: body.trim() }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? 'Erreur inconnue')
      }
      onSent()
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur inconnue')
      setIsPending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onCancel} role="dialog" aria-modal="true">
      <div className="bg-jasmine rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-fraunces text-xl font-bold text-ink">Nouveau message</h2>
          <button onClick={onCancel} className="text-ink-soft hover:text-ink text-2xl leading-none" aria-label="Fermer">×</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block font-manrope text-sm font-semibold text-ink mb-1" htmlFor="compose-to">À</label>
            <input id="compose-to" type="email" value={to} onChange={e => setTo(e.target.value)}
              className="w-full border border-sand-warm rounded-lg px-3 py-2 font-manrope text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-terracotta"
              required />
          </div>
          <div>
            <label className="block font-manrope text-sm font-semibold text-ink mb-1" htmlFor="compose-subject">Sujet</label>
            <input id="compose-subject" type="text" value={subject} onChange={e => setSubject(e.target.value)}
              className="w-full border border-sand-warm rounded-lg px-3 py-2 font-manrope text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-terracotta"
              required />
          </div>
          <div>
            <label className="block font-manrope text-sm font-semibold text-ink mb-1" htmlFor="compose-body">Message</label>
            <textarea id="compose-body" value={body} onChange={e => setBody(e.target.value)} rows={6}
              className="w-full border border-sand-warm rounded-lg px-3 py-2 font-manrope text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-terracotta resize-none"
              required />
          </div>
          {erreur && <p className="font-manrope text-sm text-red-600">{erreur}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCancel}
              className="flex-1 py-2 rounded-xl border border-sand-warm font-manrope text-sm text-ink-soft hover:bg-sand transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={isPending}
              className="flex-1 py-2 rounded-xl bg-terracotta text-white font-manrope text-sm font-semibold hover:bg-terracotta-deep transition-colors disabled:opacity-50">
              {isPending ? 'Envoi...' : 'Envoyer ✉️'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
