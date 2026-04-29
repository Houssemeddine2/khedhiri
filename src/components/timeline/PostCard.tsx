'use client'

import { useState, useTransition } from 'react'
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
  const [showReactions, setShowReactions] = useState(false)

  const avatar = avatarFromEmail(post.profiles?.email ?? '')
  const isAuthor = post.author_id === currentUser.id
  const profiles = post.profiles
  const nom = profiles?.nom ?? avatar.nom

  const handleDelete = () => {
    if (confirm('Supprimer ce message ?')) {
      startTransition(async () => { await deletePost(post.id) })
    }
  }

  /* Résumé des réactions */
  const reactionSummary = (post.reactions ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] ?? 0) + 1
    return acc
  }, {})
  const totalReactions = Object.values(reactionSummary).reduce((a, b) => a + b, 0)
  const topEmojis = Object.keys(reactionSummary).slice(0, 3)

  return (
    <article className="bg-white rounded-xl shadow-sm mb-3 overflow-hidden animate-fade-up">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <AvatarCircle
            email={profiles?.email ?? ''}
            nom={profiles?.nom}
            avatarUrl={profiles?.avatar_url}
            couleur={profiles?.couleur}
            size="lg"
          />
          <div>
            <p className="font-semibold text-ink text-[15px] leading-tight">{nom}</p>
            <p className="text-xs text-ink-soft mt-0.5">{tempsRelatif(post.created_at)}</p>
          </div>
        </div>

        {isAuthor && (
          <button
            onClick={handleDelete}
            disabled={isPending}
            aria-label="Supprimer ce message"
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-sand transition-colors text-ink-soft hover:text-terracotta disabled:opacity-40"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14H6L5 6"/>
              <path d="M9 6V4h6v2"/>
              <line x1="10" y1="11" x2="10" y2="17"/>
              <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
          </button>
        )}
      </div>

      {/* ── Contenu ─────────────────────────────────────────── */}
      {post.type === 'text' && post.content && (
        <p className="px-4 pb-3 text-ink text-[15px] leading-relaxed">{post.content}</p>
      )}

      {post.type === 'photo' && post.media_url && (
        <img
          src={post.media_url}
          alt={`Photo partagée par ${nom}`}
          className="w-full object-cover max-h-[420px]"
          loading="lazy"
        />
      )}

      {post.type === 'audio' && post.media_url && (
        <div className="px-4 pb-3">
          <VoicePlayer url={post.media_url} duration={post.audio_duration} />
        </div>
      )}

      {/* ── Résumé des réactions ─────────────────────────────── */}
      {totalReactions > 0 && (
        <div className="px-4 py-2 flex items-center justify-between text-xs text-ink-soft">
          <div className="flex items-center gap-1.5">
            <div className="flex -space-x-1">
              {topEmojis.map(emoji => (
                <span key={emoji} className="text-sm leading-none">{emoji}</span>
              ))}
            </div>
            <span>{totalReactions}</span>
          </div>
        </div>
      )}

      {/* ── Séparateur ──────────────────────────────────────── */}
      <div className="mx-4 border-t border-sand" />

      {/* ── Bouton Réagir style Facebook ───────────────────── */}
      <div className="px-2 py-1">
        <button
          onClick={() => setShowReactions(v => !v)}
          aria-expanded={showReactions}
          aria-label="Réagir à ce message"
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-sand active:bg-sand-warm transition-colors text-ink-soft hover:text-terracotta min-h-[44px] font-medium text-sm"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <path d="M8 13s1.5 2 4 2 4-2 4-2"/>
            <line x1="9" y1="9" x2="9.01" y2="9"/>
            <line x1="15" y1="9" x2="15.01" y2="9"/>
          </svg>
          Réagir
        </button>
      </div>

      {/* ── Sélecteur de réactions ──────────────────────────── */}
      {showReactions && (
        <div className="px-4 pb-3 animate-fade-up">
          <ReactionBar
            postId={post.id}
            reactions={post.reactions}
            currentUserId={currentUser.id}
          />
        </div>
      )}
    </article>
  )
}
