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

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header Sid Ahmed */}
      <div className="bg-white border-b border-sand-warm px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-olive flex items-center justify-center text-white text-lg font-bold font-manrope">
            S
          </div>
          <div>
            <p className="font-fraunces font-bold text-ink">Sid Ahmed</p>
            <p className="font-manrope text-xs text-ink-soft">
              Ton tuteur • {isSpeaking ? '🔊 Parle…' : 'Toujours là pour t\'aider'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleNewSession}
            disabled={isPending}
            className="font-manrope text-xs text-terracotta hover:text-terracotta-deep"
          >
            + Nouvelle session
          </button>
          {supported && (
            <button
              onClick={toggleModeVocal}
              aria-label={modeVocal ? 'Passer en mode texte' : 'Passer en mode vocal'}
              className={`font-manrope text-xs px-2 py-1 rounded-full border transition-colors ${
                modeVocal
                  ? 'bg-terracotta text-white border-terracotta'
                  : 'text-ink-soft border-sand-warm hover:border-terracotta'
              }`}
            >
              {modeVocal ? '🎤 Vocal' : '⌨️ Texte'}
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-cream">
        {/* Message de bienvenue si aucun message */}
        {messages.length === 0 && (
          <div className="flex gap-2 justify-start">
            <div className="w-8 h-8 rounded-full bg-olive flex items-center justify-center text-white text-sm font-bold flex-shrink-0">S</div>
            <div className="max-w-[80%] rounded-2xl px-4 py-2.5 bg-white border border-sand-warm rounded-bl-sm">
              <p className="font-manrope text-sm leading-relaxed">{accueil}</p>
              <p className="font-manrope text-xs text-ink-soft mt-1">Sid Ahmed</p>
            </div>
          </div>
        )}

        {messages.map(msg => (
          <TuteurBubble key={msg.id} message={msg} prenom={prenom} />
        ))}

        {loading && (
          <div className="flex gap-2 justify-start">
            <div className="w-8 h-8 rounded-full bg-olive flex items-center justify-center text-white text-sm font-bold flex-shrink-0">S</div>
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
        <div className="px-4 py-2 bg-white border-t border-sand-warm flex items-center gap-2">
          <img src={pendingImageUrl} alt="Photo à envoyer" className="h-12 rounded-lg object-cover" />
          <button onClick={() => setPendingImageUrl(null)} className="text-ink-soft hover:text-red-500 text-xs font-manrope">Retirer</button>
        </div>
      )}

      {/* Barre de saisie */}
      <div className="bg-white border-t border-sand-warm px-3 py-2 flex-shrink-0">
        <div className="flex items-end gap-2">
          {modeVocal ? (
            <>
              <VocalButton
                isListening={isListening}
                onStart={() => startListening()}
                onStop={() => { stopListening(); setTimeout(() => { if (input.trim()) handleSend() }, 300) }}
                disabled={loading}
              />
              <button
                onClick={() => { stopSpeaking(); toggleModeVocal() }}
                aria-label="Mode texte"
                className="flex-shrink-0 w-9 h-9 rounded-full bg-sand border border-sand-warm flex items-center justify-center text-ink-soft"
              >
                ⌨️
              </button>
            </>
          ) : (
            <>
              {/* Photo */}
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploadingPhoto}
                aria-label="Envoyer une photo du cahier"
                className="flex-shrink-0 w-9 h-9 rounded-full bg-sand flex items-center justify-center text-ink-soft hover:text-terracotta transition-colors disabled:opacity-50"
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

              {/* Zone de texte */}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pose ta question à Sid Ahmed…"
                rows={1}
                className="flex-1 rounded-2xl border border-sand-warm bg-sand px-3 py-2 font-manrope text-sm text-ink resize-none focus:outline-none focus:ring-2 focus:ring-olive max-h-28 overflow-y-auto"
              />

              {/* Envoyer */}
              <button
                onClick={handleSend}
                disabled={loading || (!input.trim() && !pendingImageUrl)}
                aria-label="Envoyer"
                className="flex-shrink-0 w-9 h-9 rounded-full bg-olive flex items-center justify-center text-white hover:bg-olive/80 transition-colors disabled:opacity-40"
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
                  className="flex-shrink-0 w-9 h-9 rounded-full bg-sand border border-sand-warm flex items-center justify-center text-ink-soft hover:text-terracotta"
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
