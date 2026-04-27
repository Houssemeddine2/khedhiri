'use client'

import { useState, useRef, useTransition, useEffect } from 'react'
import { createTutorSession } from '@/app/actions/tutor'
import { useSpeech } from '@/hooks/useSpeech'
import VocalButton from '@/components/tutor/VocalButton'

interface WidgetMessage {
  role: 'user' | 'assistant'
  content: string
}

interface TuteurWidgetProps {
  prenom: string
}

export default function TuteurWidget({ prenom }: TuteurWidgetProps) {
  const [open, setOpen] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<WidgetMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [, startTransition] = useTransition()
  const [modeVocal, setModeVocal] = useState(false)
  const { supported, isListening, transcript, startListening, stopListening, speak } = useSpeech()

  useEffect(() => {
    if (transcript) setInput(transcript)
  }, [transcript])

  const accueil = `Salut ${prenom} ! 😊 Une question sur tes devoirs ?`

  async function ensureSession() {
    if (sessionId) return sessionId
    const id = await createTutorSession()
    setSessionId(id)
    return id
  }

  async function send() {
    const text = input.trim()
    if (!text) return
    setInput('')
    const sid = await ensureSession()
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setLoading(true)
    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sid, content: text }),
      })
      const { reply } = await res.json() as { reply?: string }
      setMessages(prev => [...prev, { role: 'assistant', content: reply ?? 'Désolé…' }])
      if (modeVocal && reply) speak(reply)
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Oups ! Je n\'arrive pas à te répondre. Réessaie !' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Bouton flottant */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Ouvrir Sid Ahmed, le tuteur"
          className="fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full bg-olive shadow-lg flex items-center justify-center text-white text-2xl hover:scale-110 transition-transform"
        >
          🎓
        </button>
      )}

      {/* Mini chat */}
      {open && (
        <div className="fixed bottom-5 right-5 z-40 w-80 max-h-[70vh] bg-white rounded-2xl shadow-2xl border border-sand-warm flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-olive px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-white text-lg">🎓</span>
              <div>
                <p className="font-manrope font-semibold text-white text-sm">Sid Ahmed</p>
                <p className="font-manrope text-white/70 text-xs">Ton tuteur</p>
              </div>
            </div>
            <div className="flex gap-2">
              <a href="/tuteur" className="font-manrope text-white/80 text-xs hover:text-white">Plein écran</a>
              <button onClick={() => setOpen(false)} aria-label="Fermer" className="text-white/80 hover:text-white ml-1">✕</button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-cream min-h-0">
            <div className="bg-white border border-sand-warm rounded-xl px-3 py-2 text-sm font-manrope text-ink">
              {accueil}
            </div>
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm font-manrope ${
                  m.role === 'user' ? 'bg-terracotta text-white' : 'bg-white border border-sand-warm text-ink'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-1 items-center px-3 py-2 bg-white border border-sand-warm rounded-xl w-fit">
                <span className="w-1.5 h-1.5 bg-olive/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-olive/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-olive/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )}
          </div>

          {/* Saisie */}
          <div className="border-t border-sand-warm px-2 py-2 flex gap-2">
            {modeVocal ? (
              <>
                <VocalButton
                  isListening={isListening}
                  onStart={() => startListening()}
                  onStop={() => { stopListening(); setTimeout(() => { if (input.trim()) send() }, 300) }}
                  disabled={loading}
                />
                <button onClick={() => setModeVocal(false)} className="w-8 h-8 rounded-full bg-sand border border-sand-warm flex items-center justify-center text-ink-soft text-sm">⌨️</button>
              </>
            ) : (
              <>
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && send()}
                  placeholder="Ta question…"
                  className="flex-1 rounded-xl border border-sand-warm bg-sand px-3 py-1.5 text-sm font-manrope text-ink focus:outline-none focus:ring-1 focus:ring-olive"
                />
                {supported && (
                  <button onClick={() => setModeVocal(true)} className="w-8 h-8 rounded-full bg-sand border border-sand-warm flex items-center justify-center text-ink-soft hover:text-terracotta">🎤</button>
                )}
                <button onClick={send} disabled={loading || !input.trim()} className="w-8 h-8 rounded-full bg-olive flex items-center justify-center text-white disabled:opacity-40 hover:bg-olive/80 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
