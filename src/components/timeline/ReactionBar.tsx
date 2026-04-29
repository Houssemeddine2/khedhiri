'use client'

import { useTransition } from 'react'
import { toggleReaction } from '@/app/actions/posts'
import type { Reaction } from '@/types/post'

const EMOJIS = ['❤️', '🤗', '😊', '🎉']

interface ReactionBarProps {
  postId: string
  reactions: Reaction[]
  currentUserId: string
}

export default function ReactionBar({ postId, reactions, currentUserId }: ReactionBarProps) {
  const [isPending, startTransition] = useTransition()

  const handleReaction = (emoji: string) => {
    startTransition(async () => { await toggleReaction(postId, emoji) })
  }

  const getCount = (emoji: string) => reactions.filter(r => r.emoji === emoji).length
  const hasReacted = (emoji: string) => reactions.some(r => r.user_id === currentUserId && r.emoji === emoji)

  return (
    <div className="flex items-center justify-around gap-1 bg-sand rounded-xl p-2">
      {EMOJIS.map(emoji => {
        const count = getCount(emoji)
        const active = hasReacted(emoji)

        return (
          <button
            key={emoji}
            onClick={() => handleReaction(emoji)}
            disabled={isPending}
            aria-label={`${active ? 'Retirer' : 'Ajouter'} la réaction ${emoji}${count > 0 ? ` (${count})` : ''}`}
            aria-pressed={active}
            className={`flex flex-col items-center gap-0.5 p-2 rounded-xl transition-all min-w-[52px] min-h-[52px] justify-center
              disabled:opacity-50
              ${active
                ? 'bg-terracotta/15 scale-110'
                : 'hover:bg-sand-warm hover:scale-110 active:scale-95'
              }`}
          >
            <span className="text-2xl leading-none">{emoji}</span>
            {count > 0 && (
              <span className={`text-[11px] font-semibold leading-none ${active ? 'text-terracotta' : 'text-ink-soft'}`}>
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
