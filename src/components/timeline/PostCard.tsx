'use client'

import { useTransition } from 'react'
import { deletePost } from '@/app/actions/posts'
import { avatarFromEmail, tempsRelatif } from '@/lib/avatar'
import AvatarCircle from '@/components/ui/AvatarCircle'
import VoicePlayer from './VoicePlayer'
import ReactionBar from './ReactionBar'
import type { Post, CurrentUser } from '@/types/post'

interface PostCardProps {
  post: Post
  currentUser: CurrentUser
}

export default function PostCard({ post, currentUser }: PostCardProps) {
  const [isPending, startTransition] = useTransition()

  const avatar = avatarFromEmail(post.profiles?.email ?? '')
  const isAuthor = post.author_id === currentUser.id
  const profiles = post.profiles

  const handleDelete = () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
      startTransition(async () => {
        await deletePost(post.id)
      })
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
      {/* Header: Avatar, nom, temps + Delete button */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <AvatarCircle
            email={profiles?.email ?? ''}
            nom={profiles?.nom}
            avatarUrl={profiles?.avatar_url}
            couleur={profiles?.couleur}
            size="lg"
          />

          {/* Nom et temps relatif */}
          <div className="flex flex-col">
            <p className="font-semibold text-ink text-sm">{avatar.nom}</p>
            <p className="text-xs text-ink-soft">{tempsRelatif(post.created_at)}</p>
          </div>
        </div>

        {/* Delete button */}
        {isAuthor && (
          <button
            onClick={handleDelete}
            disabled={isPending}
            aria-label="Supprimer ce message"
            className="flex-shrink-0 text-ink-soft hover:text-terracotta transition-colors disabled:opacity-50"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="2" y="3" width="14" height="1" fill="currentColor" />
              <rect x="3" y="4" width="12" height="11" rx="1" fill="currentColor" opacity="0.3" />
              <path
                d="M6 4V2.5C6 1.95 6.45 1.5 7 1.5H11C11.55 1.5 12 1.95 12 2.5V4"
                stroke="currentColor"
                strokeWidth="1"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Content area */}
      <div className="mb-3">
        {post.type === 'text' && post.content && (
          <p className="text-ink leading-relaxed">{post.content}</p>
        )}

        {post.type === 'photo' && post.media_url && (
          <img
            src={post.media_url}
            alt="Photo partagée"
            className="rounded-xl w-full object-cover max-h-80"
          />
        )}

        {post.type === 'audio' && post.media_url && (
          <VoicePlayer url={post.media_url} duration={post.audio_duration} />
        )}
      </div>

      {/* Reactions */}
      <ReactionBar
        postId={post.id}
        reactions={post.reactions}
        currentUserId={currentUser.id}
      />
    </div>
  )
}
