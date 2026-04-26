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

export default function ReactionBar({
  postId,
  reactions,
  currentUserId,
}: ReactionBarProps) {
  const [isPending, startTransition] = useTransition()

  const handleReaction = (emoji: string) => {
    startTransition(async () => {
      await toggleReaction(postId, emoji)
    })
  }

  const getReactionCount = (emoji: string) => {
    return reactions.filter((r) => r.emoji === emoji).length
  }

  const hasUserReacted = (emoji: string) => {
    return reactions.some((r) => r.user_id === currentUserId && r.emoji === emoji)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {EMOJIS.map((emoji) => {
        const count = getReactionCount(emoji)
        const isActive = hasUserReacted(emoji)

        return (
          <button
            key={emoji}
            onClick={() => handleReaction(emoji)}
            disabled={isPending}
            className={`rounded-full px-3 py-1 text-sm transition-colors ${
              isActive
                ? 'bg-terracotta text-white'
                : 'bg-jasmine text-ink-soft'
            } disabled:opacity-50`}
          >
            <span>{emoji}</span>
            {count > 0 && <span className="ml-1 text-xs">{count}</span>}
          </button>
        )
      })}
    </div>
  )
}
