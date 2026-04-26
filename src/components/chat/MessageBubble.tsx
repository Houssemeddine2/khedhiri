'use client'

import { useTransition } from 'react'
import type { Message } from '@/types/chat'
import type { CurrentUser } from '@/types/post'
import { avatarFromEmail, tempsRelatif } from '@/lib/avatar'
import { deleteMessage } from '@/app/actions/chat'
import VoicePlayer from '@/components/timeline/VoicePlayer'

// Map fixe sender_id → email (3 membres hardcodés)
const EMAILS: Record<string, string> = {
  'b6025d5f-77d5-4208-b489-bcc717ebc01c': 'houssem@khedhiri.me',
  '1a0967e9-91e0-48f6-a3da-752255274153': 'sandra@khedhiri.me',
  '617eff77-47ed-40e0-b784-c027183c9bee': 'sarah@khedhiri.me',
}

interface MessageBubbleProps {
  message: Message
  currentUser: CurrentUser
}

export default function MessageBubble({ message, currentUser }: MessageBubbleProps) {
  const [isPending, startTransition] = useTransition()
  const isOwn = message.sender_id === currentUser.id
  const senderEmail = EMAILS[message.sender_id] ?? ''
  const avatar = avatarFromEmail(senderEmail)

  function handleDelete() {
    if (!confirm('Supprimer ce message ?')) return
    startTransition(async () => {
      await deleteMessage(message.id)
    })
  }

  return (
    <div className={`flex items-end gap-2 mb-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar (affiché uniquement pour les messages des autres) */}
      {!isOwn && (
        <span
          className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold font-manrope flex-shrink-0 ${avatar.couleurBg}`}
          aria-hidden="true"
        >
          {avatar.initiale}
        </span>
      )}

      <div className={`flex flex-col gap-1 max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Bulle */}
        <div
          className={`rounded-2xl px-3 py-2 ${
            isOwn
              ? 'bg-terracotta text-white rounded-br-sm'
              : 'bg-jasmine text-ink rounded-bl-sm'
          }`}
        >
          {message.type === 'text' && (
            <p className="font-manrope text-sm whitespace-pre-wrap">{message.content}</p>
          )}
          {message.type === 'photo' && (
            <img
              src={message.media_url!}
              alt="Photo envoyée"
              className="rounded-xl max-w-full max-h-60 object-cover"
            />
          )}
          {message.type === 'audio' && (
            <VoicePlayer url={message.media_url!} duration={message.audio_duration} />
          )}
        </div>

        {/* Horodatage + bouton suppression */}
        <div className={`flex items-center gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-xs text-ink-soft font-manrope">
            {tempsRelatif(message.created_at)}
          </span>
          {isOwn && (
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="text-ink-soft hover:text-terracotta transition-colors disabled:opacity-40"
              aria-label="Supprimer ce message"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4h6v2" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
