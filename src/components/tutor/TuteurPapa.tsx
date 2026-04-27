'use client'

import { useState } from 'react'
import type { TutorSession, TutorMessage } from '@/types/tutor'
import type { Membre } from '@/lib/membres'

interface TuteurPapaProps {
  sessions: TutorSession[]
  filles: Membre[]
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
}

export default function TuteurPapa({ sessions, filles }: TuteurPapaProps) {
  const [selectedSession, setSelectedSession] = useState<TutorSession | null>(null)
  const [messages, setMessages] = useState<TutorMessage[]>([])
  const [loading, setLoading] = useState(false)

  const filleMap = Object.fromEntries(filles.map(f => [f.id, f]))

  async function loadSession(session: TutorSession) {
    setSelectedSession(session)
    setLoading(true)
    const res = await fetch(`/api/tutor/historique?sessionId=${session.id}`)
    if (res.ok) {
      const { messages: msgs } = await res.json() as { messages: TutorMessage[] }
      setMessages(msgs)
    }
    setLoading(false)
  }

  if (selectedSession) {
    const fille = filleMap[selectedSession.user_id]
    return (
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <button onClick={() => setSelectedSession(null)} className="font-manrope text-sm text-ink-soft hover:text-ink flex items-center gap-1">
          ← Retour aux sessions
        </button>
        <div>
          <h2 className="font-fraunces text-xl font-bold text-ink">
            Session de {fille?.nom ?? '?'}
          </h2>
          <p className="font-manrope text-xs text-ink-soft">{formatDate(selectedSession.created_at)}</p>
          {selectedSession.titre && (
            <p className="font-manrope text-sm text-ink-soft mt-1 italic">"{selectedSession.titre}"</p>
          )}
        </div>

        {loading ? (
          <p className="font-manrope text-ink-soft text-sm text-center py-8">Chargement…</p>
        ) : (
          <div className="space-y-3">
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-olive flex items-center justify-center text-white text-xs font-bold flex-shrink-0">N</div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm font-manrope ${
                  msg.role === 'user' ? 'bg-terracotta/20 text-ink' : 'bg-white border border-sand-warm text-ink'
                }`}>
                  {msg.image_url && <img src={msg.image_url} alt="" className="rounded-lg mb-1 max-h-32 object-cover" />}
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    )
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div>
        <h1 className="font-fraunces text-2xl font-bold text-ink">Historique de Nour</h1>
        <p className="font-manrope text-sm text-ink-soft">{sessions.length} session{sessions.length !== 1 ? 's' : ''} au total</p>
      </div>

      {sessions.length === 0 ? (
        <p className="font-manrope text-ink-soft text-sm text-center py-12">
          Aucune session pour l&apos;instant. Sandra et Sarah n&apos;ont pas encore utilisé Nour.
        </p>
      ) : (
        <div className="space-y-2">
          {sessions.map(s => {
            const fille = filleMap[s.user_id]
            return (
              <button
                key={s.id}
                onClick={() => loadSession(s)}
                className="w-full text-left bg-white border border-sand-warm rounded-2xl p-4 hover:border-terracotta/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-manrope font-semibold text-sm text-ink">{fille?.nom ?? '?'}</span>
                  </div>
                  <span className="font-manrope text-xs text-ink-soft">{formatDate(s.updated_at)}</span>
                </div>
                {s.titre && (
                  <p className="font-manrope text-xs text-ink-soft mt-1 truncate italic">"{s.titre}"</p>
                )}
              </button>
            )
          })}
        </div>
      )}
    </main>
  )
}
