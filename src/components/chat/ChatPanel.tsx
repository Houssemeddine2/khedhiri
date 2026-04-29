'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useChat } from '@/contexts/ChatContext'
import { membreById } from '@/lib/membres'
import { conversationId } from '@/lib/conversation'
import MessageBubble from './MessageBubble'
import ChatInput from './ChatInput'
import AvatarCircle from '@/components/ui/AvatarCircle'
import type { Message } from '@/types/chat'
import { useCall } from '@/contexts/CallContext'

type OtherProfile = { nom: string | null; avatar_url: string | null; couleur: string | null }

function formatLastSeen(iso: string): string {
  const diffMin = (Date.now() - new Date(iso).getTime()) / 60000
  if (diffMin < 2)  return 'En ligne'
  if (diffMin < 60) return `Vu il y a ${Math.floor(diffMin)} min`
  const d = new Date(iso)
  if (diffMin < 24 * 60) return `Vu à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
  return `Vu le ${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`
}

export default function ChatPanel() {
  const { openUserId, closeChat } = useChat()
  const { initiateCall, status: callStatus } = useCall()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [messages, setMessages]     = useState<Message[]>([])
  const [otherProfile, setOtherProfile] = useState<OtherProfile | null>(null)
  const [isOnline, setIsOnline]     = useState(false)
  const [lastSeen, setLastSeen]     = useState<string | null>(null)
  const [minimized, setMinimized]   = useState(false)
  const [open, setOpen]             = useState(false)   // pour l'animation d'entrée
  const bottomRef = useRef<HTMLDivElement>(null)

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  ), [])

  const otherUser = openUserId ? membreById(openUserId) : null
  const convId    = useMemo(
    () => currentUserId && openUserId ? conversationId(currentUserId, openUserId) : null,
    [currentUserId, openUserId],
  )

  // Animation d'ouverture
  useEffect(() => {
    if (openUserId) {
      setMinimized(false)
      requestAnimationFrame(() => setOpen(true))
    } else {
      setOpen(false)
    }
  }, [openUserId])

  // Utilisateur courant
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null))
  }, [supabase])

  // Reset + profil au changement de conversation
  useEffect(() => {
    setMessages([])
    setOtherProfile(null)
    setIsOnline(false)
    setLastSeen(null)
    if (!openUserId) return

    supabase.from('profiles')
      .select('nom, avatar_url, couleur, last_seen_at')
      .eq('id', openUserId)
      .single()
      .then(({ data }) => {
        if (!data) return
        setOtherProfile({ nom: data.nom, avatar_url: data.avatar_url, couleur: data.couleur })
        if (data.last_seen_at) {
          setLastSeen(data.last_seen_at)
          setIsOnline((Date.now() - new Date(data.last_seen_at).getTime()) / 60000 < 3)
        }
      })
  }, [openUserId, supabase])

  // Refresh du statut toutes les 30 s
  useEffect(() => {
    if (!openUserId) return
    const id = setInterval(async () => {
      const { data } = await supabase.from('profiles').select('last_seen_at').eq('id', openUserId).single()
      if (data?.last_seen_at) {
        setLastSeen(data.last_seen_at)
        setIsOnline((Date.now() - new Date(data.last_seen_at).getTime()) / 60000 < 3)
      }
    }, 30_000)
    return () => clearInterval(id)
  }, [openUserId, supabase])

  // Messages + Realtime
  const fetchMessages = useCallback(async () => {
    if (!convId) return
    const { data } = await supabase
      .from('messages').select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
      .limit(100)
    if (data) setMessages(data as Message[])
  }, [convId, supabase])

  useEffect(() => {
    if (!convId) return
    fetchMessages()
    const ch = supabase.channel(`bubble-chat-${convId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${convId}`,
      }, fetchMessages)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [convId, fetchMessages, supabase])

  // Scroll automatique vers le bas
  useEffect(() => {
    if (!minimized && messages.length > 0) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 60)
    }
  }, [messages, minimized])

  if (!openUserId || !otherUser) return null

  const displayName = otherProfile?.nom ?? otherUser.nom
  const statusText  = isOnline ? 'En ligne' : (lastSeen ? formatLastSeen(lastSeen) : 'Hors ligne')

  return (
    /* Bulle ancrée en bas à droite — desktop uniquement */
    <div
      className="hidden md:flex fixed bottom-4 right-4 z-50 flex-col rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.22)] bg-white overflow-hidden transition-all duration-200 ease-out origin-bottom-right"
      style={{
        width: 328,
        transform: open ? 'scale(1) translateY(0)' : 'scale(0.85) translateY(24px)',
        opacity:   open ? 1 : 0,
        maxHeight: minimized ? '52px' : '480px',
      }}
      role="dialog"
      aria-label={`Conversation avec ${displayName}`}
    >
      {/* ── En-tête cliquable (min/max) ───────────────────── */}
      <div
        className="flex items-center gap-2.5 px-3 h-[52px] bg-white border-b border-sand cursor-pointer select-none flex-shrink-0"
        onClick={() => setMinimized(m => !m)}
      >
        {/* Avatar + point de statut */}
        <div className="relative flex-shrink-0">
          <AvatarCircle
            email={otherUser.email}
            nom={otherProfile?.nom}
            avatarUrl={otherProfile?.avatar_url}
            couleur={otherProfile?.couleur}
            size="sm"
          />
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${isOnline ? 'bg-olive' : 'bg-slate-300'}`}
            aria-hidden="true"
          />
        </div>

        {/* Nom + statut */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-ink text-sm truncate leading-tight">{displayName}</p>
          <p className={`text-[11px] truncate ${isOnline ? 'text-olive' : 'text-ink-soft'}`}>{statusText}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
          {/* Appel vocal */}
          <button
            onClick={() => openUserId && initiateCall(openUserId, displayName, 'audio')}
            disabled={callStatus !== 'idle'}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${callStatus === 'idle' ? 'hover:bg-sand text-terracotta' : 'text-ink-soft/30 cursor-not-allowed'}`}
            title={callStatus !== 'idle' ? 'Appel en cours…' : `Appeler ${displayName}`}
            aria-label={`Appeler ${displayName}`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.13 6.13l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
          </button>

          {/* Appel vidéo */}
          <button
            onClick={() => openUserId && initiateCall(openUserId, displayName, 'video')}
            disabled={callStatus !== 'idle'}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${callStatus === 'idle' ? 'hover:bg-sand text-terracotta' : 'text-ink-soft/30 cursor-not-allowed'}`}
            title={callStatus !== 'idle' ? 'Appel en cours…' : `Appel vidéo avec ${displayName}`}
            aria-label={`Appel vidéo avec ${displayName}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M23 7 16 12 23 17z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
          </button>

          {/* Réduire / agrandir */}
          <button
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-sand transition-colors text-ink-soft"
            aria-label={minimized ? 'Agrandir' : 'Réduire'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {minimized
                ? <polyline points="18 15 12 9 6 15"/>
                : <polyline points="6 9 12 15 18 9"/>}
            </svg>
          </button>

          {/* Fermer */}
          <button
            onClick={closeChat}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-sand transition-colors text-ink-soft"
            aria-label="Fermer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Messages ──────────────────────────────────────── */}
      {!minimized && (
        <>
          <div className="flex-1 overflow-y-auto bg-sand/10" style={{ minHeight: 0 }}>
            <div className="px-3 py-3 pb-1">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8">
                  <AvatarCircle
                    email={otherUser.email}
                    nom={otherProfile?.nom}
                    avatarUrl={otherProfile?.avatar_url}
                    couleur={otherProfile?.couleur}
                    size="lg"
                  />
                  <p className="font-caveat text-ink-soft text-base">Commencez à vous écrire ♡</p>
                </div>
              ) : currentUserId ? (
                <div className="space-y-0.5">
                  {messages.map((msg, i) => {
                    const prev = messages[i - 1]
                    const next = messages[i + 1]
                    return (
                      <MessageBubble
                        key={msg.id}
                        message={msg}
                        currentUser={{ id: currentUserId, email: '' }}
                        isOwn={msg.sender_id === currentUserId}
                        isFirst={!prev || prev.sender_id !== msg.sender_id}
                        isLast={!next || next.sender_id !== msg.sender_id}
                        otherProfile={otherProfile}
                        otherEmail={otherUser.email}
                      />
                    )
                  })}
                </div>
              ) : null}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* ── Saisie ────────────────────────────────────── */}
          <div className="flex-shrink-0">
            <ChatInput otherUserId={openUserId} onSent={fetchMessages} />
          </div>
        </>
      )}
    </div>
  )
}
