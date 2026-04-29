'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import type { Message } from '@/types/chat'
import type { CurrentUser } from '@/types/post'
import type { Membre } from '@/lib/membres'
import { avatarFromEmail } from '@/lib/avatar'
import MessageBubble from '@/components/chat/MessageBubble'
import ChatInput from '@/components/chat/ChatInput'
import AvatarCircle from '@/components/ui/AvatarCircle'

interface ChatViewProps {
  initialMessages: Message[]
  currentUser: CurrentUser
  otherUser: Membre
  otherProfile?: { nom: string | null; avatar_url: string | null; couleur: string | null } | null
  conversationId: string
  supabaseUrl: string
  supabaseAnonKey: string
}

export default function ChatView({
  initialMessages,
  currentUser,
  otherUser,
  otherProfile,
  conversationId,
  supabaseUrl,
  supabaseAnonKey,
}: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const bottomRef = useRef<HTMLDivElement>(null)
  const otherAvatar = avatarFromEmail(otherUser.email)
  const displayName = otherProfile?.nom ?? otherAvatar.nom

  const supabase = useMemo(
    () => createBrowserClient(supabaseUrl, supabaseAnonKey),
    [supabaseUrl, supabaseAnonKey],
  )

  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(100)
    if (data) setMessages(data as Message[])
  }, [supabase, conversationId])

  useEffect(() => {
    fetchMessages()
    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, () => fetchMessages())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase, conversationId, fetchMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    /* Occupe toute la hauteur disponible sous le header NavBar fixe */
    <div className="flex flex-col" style={{ height: 'calc(100dvh - 56px)' }}>

      {/* ── Header Messenger ─────────────────────────────────── */}
      <div className="flex-shrink-0 bg-white border-b border-sand shadow-sm">
        <div className="h-14 px-3 flex items-center gap-3 max-w-3xl mx-auto">
          {/* Bouton retour */}
          <Link
            href="/"
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-sand transition-colors text-ink-soft flex-shrink-0"
            aria-label="Retour à l'accueil"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </Link>

          {/* Avatar + nom */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              <AvatarCircle
                email={otherUser.email}
                nom={otherProfile?.nom}
                avatarUrl={otherProfile?.avatar_url}
                couleur={otherProfile?.couleur}
                size="md"
              />
              {/* Indicateur en ligne (statique pour l'instant) */}
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-olive border-2 border-white" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-ink text-[15px] truncate leading-tight">{displayName}</p>
              <p className="text-xs text-olive truncate">En ligne</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <Link
              href={`/chats/${otherUser.id}`}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-sand transition-colors text-terracotta"
              aria-label="Actualiser la conversation"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Messages ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-sand/30">
        <div className="max-w-3xl mx-auto px-3 py-4 pb-2">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <AvatarCircle
                email={otherUser.email}
                nom={otherProfile?.nom}
                avatarUrl={otherProfile?.avatar_url}
                couleur={otherProfile?.couleur}
                size="xl"
              />
              <p className="font-fraunces italic text-terracotta text-xl">{displayName}</p>
              <p className="font-caveat text-ink-soft text-lg">Commencez à vous écrire ♡</p>
            </div>
          ) : (
            <MessageList messages={messages} currentUser={currentUser} otherProfile={otherProfile} otherEmail={otherUser.email} />
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Barre de saisie ──────────────────────────────────── */}
      <div className="flex-shrink-0" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <ChatInput otherUserId={otherUser.id} onSent={fetchMessages} />
      </div>
    </div>
  )
}

/* Groupe les messages consécutifs du même expéditeur */
function MessageList({
  messages,
  currentUser,
  otherProfile,
  otherEmail,
}: {
  messages: Message[]
  currentUser: CurrentUser
  otherProfile?: { nom: string | null; avatar_url: string | null; couleur: string | null } | null
  otherEmail: string
}) {
  return (
    <div className="space-y-0.5">
      {messages.map((msg, i) => {
        const isOwn = msg.sender_id === currentUser.id
        const prev = messages[i - 1]
        const next = messages[i + 1]
        const isFirst = !prev || prev.sender_id !== msg.sender_id
        const isLast = !next || next.sender_id !== msg.sender_id

        return (
          <MessageBubble
            key={msg.id}
            message={msg}
            currentUser={currentUser}
            isOwn={isOwn}
            isFirst={isFirst}
            isLast={isLast}
            otherProfile={otherProfile}
            otherEmail={otherEmail}
          />
        )
      })}
    </div>
  )
}
