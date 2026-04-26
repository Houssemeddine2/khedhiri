// src/components/chat/ChatView.tsx
'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { Message } from '@/types/chat'
import type { CurrentUser } from '@/types/post'
import type { Membre } from '@/lib/membres'
import { avatarFromEmail } from '@/lib/avatar'
import MessageBubble from '@/components/chat/MessageBubble'
import ChatInput from '@/components/chat/ChatInput'

interface ChatViewProps {
  initialMessages: Message[]
  currentUser: CurrentUser
  otherUser: Membre
  conversationId: string
  supabaseUrl: string
  supabaseAnonKey: string
}

export default function ChatView({
  initialMessages,
  currentUser,
  otherUser,
  conversationId,
  supabaseUrl,
  supabaseAnonKey,
}: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const bottomRef = useRef<HTMLDivElement>(null)
  const otherAvatar = avatarFromEmail(otherUser.email)

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

  // Scroll automatique vers le bas à chaque nouveau message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex flex-col min-h-screen bg-cream">
      {/* En-tête du chat */}
      <div className="bg-cream border-b border-terracotta/20 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <span
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold font-manrope ${otherAvatar.couleurBg}`}
            aria-hidden="true"
          >
            {otherAvatar.initiale}
          </span>
          <div>
            <p className="font-fraunces text-ink font-semibold">{otherAvatar.nom}</p>
            <p className="text-xs text-ink-soft font-manrope">{otherUser.email}</p>
          </div>
        </div>
      </div>

      {/* Liste des messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        <div className="max-w-lg mx-auto">
          {messages.length === 0 ? (
            <p className="font-caveat text-xl text-ink-soft text-center mt-12">
              Commencez à vous écrire ♡
            </p>
          ) : (
            messages.map(msg => (
              <MessageBubble
                key={msg.id}
                message={msg}
                currentUser={currentUser}
              />
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Barre de saisie sticky */}
      <div className="sticky bottom-0">
        <ChatInput otherUserId={otherUser.id} onSent={fetchMessages} />
      </div>
    </div>
  )
}
