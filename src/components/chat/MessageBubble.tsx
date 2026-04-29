'use client'

import { useTransition } from 'react'
import type { Message } from '@/types/chat'
import type { CurrentUser } from '@/types/post'
import { avatarFromEmail, tempsRelatif } from '@/lib/avatar'
import { deleteMessage } from '@/app/actions/chat'
import VoicePlayer from '@/components/timeline/VoicePlayer'
import AvatarCircle from '@/components/ui/AvatarCircle'

const EMAILS: Record<string, string> = {
  'b6025d5f-77d5-4208-b489-bcc717ebc01c': 'houssem@khedhiri.me',
  '1a0967e9-91e0-48f6-a3da-752255274153': 'sandra@khedhiri.me',
  '617eff77-47ed-40e0-b784-c027183c9bee': 'sarah@khedhiri.me',
}

interface MessageBubbleProps {
  message: Message
  currentUser: CurrentUser
  isOwn: boolean
  isFirst: boolean
  isLast: boolean
  otherProfile?: { nom: string | null; avatar_url: string | null; couleur: string | null } | null
  otherEmail: string
}

export default function MessageBubble({
  message,
  isOwn,
  isFirst,
  isLast,
  otherProfile,
  otherEmail,
}: MessageBubbleProps) {
  const [isPending, startTransition] = useTransition()
  const senderEmail = EMAILS[message.sender_id] ?? otherEmail

  function handleDelete() {
    if (!confirm('Supprimer ce message ?')) return
    startTransition(async () => { await deleteMessage(message.id) })
  }

  /* Rayon des coins selon position dans le groupe — style Messenger */
  const radius = isOwn
    ? `rounded-[18px] ${isFirst ? '' : 'rounded-tr-[4px]'} ${isLast ? '' : 'rounded-br-[4px]'}`
    : `rounded-[18px] ${isFirst ? '' : 'rounded-tl-[4px]'} ${isLast ? '' : 'rounded-bl-[4px]'}`

  return (
    <div className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'} ${isFirst ? 'mt-3' : 'mt-0.5'}`}>

      {/* Avatar (seulement dernier message du groupe, côté autre) */}
      <div className="w-8 flex-shrink-0">
        {!isOwn && isLast && (
          <AvatarCircle
            email={otherEmail}
            nom={otherProfile?.nom}
            avatarUrl={otherProfile?.avatar_url}
            couleur={otherProfile?.couleur}
            size="sm"
          />
        )}
      </div>

      {/* Bulle */}
      <div className={`flex flex-col max-w-[72%] ${isOwn ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-3 py-2 text-[15px] leading-relaxed ${radius} ${
            isOwn
              ? 'bg-terracotta text-white'
              : 'bg-white text-ink shadow-sm'
          } ${isPending ? 'opacity-60' : ''}`}
        >
          {message.type === 'text' && (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          )}
          {message.type === 'photo' && message.media_url && (
            <img
              src={message.media_url}
              alt="Photo envoyée"
              className="rounded-xl max-w-full max-h-64 object-cover"
              loading="lazy"
            />
          )}
          {message.type === 'audio' && message.media_url && (
            <VoicePlayer url={message.media_url} duration={message.audio_duration} />
          )}
        </div>

        {/* Heure + supprimer (seulement sur le dernier du groupe) */}
        {isLast && (
          <div className={`flex items-center gap-2 mt-0.5 px-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
            <span className="text-[11px] text-ink-soft">{tempsRelatif(message.created_at)}</span>
            {isOwn && (
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="text-ink-soft/50 hover:text-terracotta transition-colors disabled:opacity-30"
                aria-label="Supprimer"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14H6L5 6"/>
                  <path d="M9 6V4h6v2"/>
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
