'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { createTutorSession } from '@/app/actions/tutor'
import { uploadMedia } from '@/app/actions/posts'
import TuteurBubble from './TuteurBubble'
import type { TutorMessage, TutorSession } from '@/types/tutor'
import { useSpeech } from '@/hooks/useSpeech'
import VocalButton from './VocalButton'

interface TuteurChatProps {
  prenom: string
  sessions: TutorSession[]
  initialMessages: TutorMessage[]
  initialSessionId: string | null
}

const MESSAGE_ACCUEIL: TutorMessage = {
  id: 'accueil',
  session_id: '',
  user_id: '',
  role: 'assistant',
  content: '',
  image_url: null,
  created_at: '',
}

export default function TuteurChat({ prenom, sessions: initialSessions, initialMessages, initialSessionId }: TuteurChatProps) {
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId)
  const [sessions, setSessions] = useState<TutorSession[]>(initialSessions)
  const [messages, setMessages] = useState<TutorMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileRef   = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const inputRef = useRef('')

  const [modeVocal, setModeVocal] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('sidahmed_mode_vocal') === '1'
  })
  const { supported, isListening, isSpeaking, transcript, startListening, stopListening, speak, stopSpeaking } = useSpeech()

  const accueil = `Bonjour ${prenom} ! 😊 Je suis Sid Ahmed, ton tuteur. Montre-moi ton cahier ou pose-moi une question sur tes devoirs !`

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (transcript) setInput(transcript)
  }, [transcript])

  useEffect(() => {
    inputRef.current = input
  }, [input])

  async function ensureSession(): Promise<string> {
    if (sessionId) return sessionId
    const id = await createTutorSession()
    setSessionId(id)
    setSessions(prev => [{ id, user_id: '', titre: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, ...prev])
    return id
  }

  async function handleSend() {
    const text = input.trim()
    if (!text && !pendingImageUrl) return
    setInput('')

    const sid = await ensureSession()

    const userMsg: TutorMessage = {
      id: crypto.randomUUID(),
      session_id: sid,
      user_id: '',
      role: 'user',
      content: text || '(photo)',
      image_url: pendingImageUrl,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    setPendingImageUrl(null)
    setLoading(true)

    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sid, content: text || '(photo)', imageUrl: pendingImageUrl }),
      })
      const { reply } = await res.json() as { reply?: string }

      const assistantMsg: TutorMessage = {
        id: crypto.randomUUID(),
        session_id: sid,
        user_id: '',
        role: 'assistant',
        content: reply ?? 'Désolé, je n\'ai pas pu répondre.',
        image_url: null,
        created_at: new Date().toISOString(),
      }
      setMessages(prev => [...prev, assistantMsg])
      if (modeVocal && reply) {
        speak(reply)
      }
    } catch {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(), session_id: sid, user_id: '',
        role: 'assistant', content: 'Oups ! Je n\'arrive pas à te répondre. Réessaie !',
        image_url: null, created_at: new Date().toISOString(),
      }])
    } finally {
      setLoading(false)
    }
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPhoto(true)
    const fd = new FormData()
    fd.append('file', file)
    const url = await uploadMedia(fd)
    setPendingImageUrl(url)
    setUploadingPhoto(false)
    textareaRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  async function handleNewSession() {
    startTransition(async () => {
      const id = await createTutorSession()
      setSessionId(id)
      setMessages([])
      setSessions(prev => [{ id, user_id: '', titre: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, ...prev])
    })
  }

  function toggleModeVocal() {
    const next = !modeVocal
    setModeVocal(next)
    localStorage.setItem('sidahmed_mode_vocal', next ? '1' : '0')
    if (!next) stopSpeaking()
  }

  async function handleLoadSession(id: string) {
    const res = await fetch(`/api/tutor/session?id=${id}`)
    if (res.ok) {
      const { messages: msgs } = await res.json() as { messages: TutorMessage[] }
      setSessionId(id)
      setMessages(msgs)
    }
  }

  const MATIERES = [
    { icon: '➕', label: 'Maths' },
    { icon: '📖', label: 'Français' },
    { icon: '🌙', label: 'Arabe' },
    { icon: '🔬', label: 'Sciences' },
    { icon: '🌍', label: 'Histoire-Géo' },
    { icon: '📐', label: 'Géométrie' },
  ]

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 56px)' }}>

      {/* ── Header redesigné ── */}
      <div className="flex-shrink-0" style={{ background: 'linear-gradient(135deg, #6B7B3F 0%, #5a6835 60%, #C5563D 100%)' }}>
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.25)', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.4)' }}>
              <span className="font-fraunces font-bold text-white text-xl drop-shadow">S</span>
            </div>
            <div>
              <p className="font-fraunces font-bold text-white text-[17px] leading-tight drop-shadow-sm">Professeur Sid Ahmed</p>
              <p className="font-manrope text-white/80 text-xs mt-0.5">
                {isSpeaking ? '🔊 En train de parler…' : '● Disponible pour t\'aider'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleNewSession}
              disabled={isPending}
              className="font-manrope text-xs text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors"
            >
              + Nouvelle session
            </button>
            {supported && (
              <button
                onClick={toggleModeVocal}
                aria-label={modeVocal ? 'Passer en mode texte' : 'Passer en mode vocal'}
                className={`font-manrope text-xs px-3 py-1.5 rounded-full transition-colors ${
                  modeVocal
                    ? 'bg-white text-olive font-semibold'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                {modeVocal ? '🎤 Vocal' : '⌨️ Texte'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Zone messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-cream">

        {/* État vide : carte de bienvenue + matières */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center gap-5 pt-6 pb-4">
            {/* Carte de bienvenue */}
            <div className="w-full max-w-lg bg-white rounded-3xl shadow-sm border border-sand-warm overflow-hidden">
              <div className="px-6 py-5 flex items-center gap-4" style={{ background: 'linear-gradient(120deg, #6B7B3F15 0%, #C5563D10 100%)' }}>
                <div className="w-14 h-14 rounded-2xl bg-olive flex items-center justify-center flex-shrink-0">
                  <span className="font-fraunces font-bold text-white text-2xl">S</span>
                </div>
                <div>
                  <p className="font-fraunces italic text-[18px] text-ink leading-tight">
                    Bonjour {prenom} !
                  </p>
                  <p className="font-manrope text-sm text-ink-soft mt-0.5">
                    Montre-moi ton cahier ou pose ta question.
                  </p>
                </div>
              </div>
              <div className="px-6 pb-5 pt-4">
                <p className="font-manrope text-xs text-ink-soft mb-3 uppercase tracking-wide font-semibold">Je peux t'aider en :</p>
                <div className="grid grid-cols-3 gap-2">
                  {MATIERES.map(m => (
                    <button
                      key={m.label}
                      onClick={() => { setInput(`Aide-moi en ${m.label}`); textareaRef.current?.focus() }}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-sand hover:bg-sand-warm border border-transparent hover:border-terracotta/20 transition-all text-left group"
                    >
                      <span className="text-base">{m.icon}</span>
                      <span className="font-manrope text-xs text-ink group-hover:text-terracotta font-medium">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <p className="font-caveat text-sm text-ink-soft/60">
              📷 Tu peux aussi m'envoyer une photo de ton cahier !
            </p>
          </div>
        )}

        {messages.map(msg => (
          <TuteurBubble key={msg.id} message={msg} prenom={prenom} />
        ))}

        {loading && (
          <div className="flex gap-2 justify-start">
            <div className="w-8 h-8 rounded-xl bg-olive flex items-center justify-center text-white text-sm font-bold flex-shrink-0">S</div>
            <div className="bg-white border border-sand-warm rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
              <span className="w-2 h-2 bg-olive/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-olive/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-olive/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Photo en attente */}
      {pendingImageUrl && (
        <div className="px-4 py-2 bg-white border-t border-sand-warm flex items-center gap-2 flex-shrink-0">
          <img src={pendingImageUrl} alt="Photo à envoyer" className="h-12 rounded-lg object-cover" />
          <button onClick={() => setPendingImageUrl(null)} className="text-ink-soft hover:text-red-500 text-xs font-manrope">Retirer</button>
        </div>
      )}

      {/* ── Barre de saisie ── */}
      <div className="bg-white border-t border-sand-warm px-3 py-3 flex-shrink-0">
        <div className="flex items-end gap-2">
          {modeVocal ? (
            <>
              <VocalButton
                isListening={isListening}
                onStart={() => startListening()}
                onStop={() => { stopListening(); setTimeout(() => { if (inputRef.current.trim()) handleSend() }, 300) }}
                disabled={loading}
              />
              <button
                onClick={() => { stopSpeaking(); toggleModeVocal() }}
                aria-label="Mode texte"
                className="flex-shrink-0 w-10 h-10 rounded-xl bg-sand border border-sand-warm flex items-center justify-center text-ink-soft"
              >
                ⌨️
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploadingPhoto}
                aria-label="Envoyer une photo du cahier"
                className="flex-shrink-0 w-10 h-10 rounded-xl bg-sand hover:bg-sand-warm flex items-center justify-center text-ink-soft hover:text-terracotta transition-colors disabled:opacity-50"
              >
                {uploadingPhoto ? (
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                )}
              </button>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoChange} />

              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pose ta question à Professeur Sid Ahmed…"
                rows={1}
                className="flex-1 rounded-2xl border border-sand-warm bg-sand px-4 py-2.5 font-manrope text-sm text-ink resize-none focus:outline-none focus:ring-2 focus:ring-olive/40 max-h-28 overflow-y-auto"
              />

              <button
                onClick={handleSend}
                disabled={loading || (!input.trim() && !pendingImageUrl)}
                aria-label="Envoyer"
                className="flex-shrink-0 w-10 h-10 rounded-xl bg-olive flex items-center justify-center text-white hover:bg-olive/80 transition-colors disabled:opacity-40"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>

              {supported && (
                <button
                  onClick={toggleModeVocal}
                  aria-label="Passer en mode vocal"
                  className="flex-shrink-0 w-10 h-10 rounded-xl bg-sand border border-sand-warm flex items-center justify-center text-ink-soft hover:text-terracotta transition-colors"
                >
                  🎤
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
