'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import PostCard from './PostCard'
import DefiCard from '@/components/defis/DefiCard'
import MotCard from '@/components/defis/MotCard'
import ComposeBar from './ComposeBar'
import type { Post, CurrentUser } from '@/types/post'
import type { Defi } from '@/types/defi'

interface TimelineProps {
  initialPosts: Post[]
  currentUser: CurrentUser
  userProfile?: { nom: string | null; avatar_url: string | null; couleur: string | null }
  supabaseUrl: string
  supabaseAnonKey: string
}

type FeedItem =
  | { kind: 'post';  id: string; created_at: string; data: Post }
  | { kind: 'defi';  id: string; created_at: string; data: Defi }

export default function Timeline({
  initialPosts,
  currentUser,
  userProfile,
  supabaseUrl,
  supabaseAnonKey,
}: TimelineProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [defis, setDefis] = useState<Defi[]>([])
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const supabase = useMemo(
    () => createBrowserClient(supabaseUrl, supabaseAnonKey),
    [supabaseUrl, supabaseAnonKey],
  )

  const fetchPosts = useCallback(async () => {
    const { data } = await supabase
      .from('posts')
      .select('*, reactions(*), profiles(email, nom, avatar_url, couleur)')
      .order('created_at', { ascending: false })
      .limit(50)
    if (data) setPosts(data as Post[])
  }, [supabase])

  const fetchDefis = useCallback(async () => {
    const res = await fetch('/api/defis')
    if (res.ok) {
      const { defis: data } = await res.json()
      setDefis((data as Defi[]).slice(0, 5))
    }
  }, [])

  useEffect(() => {
    fetchPosts()
    fetchDefis()

    // Nettoyer le channel précédent avant d'en créer un nouveau
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const channel = supabase
      .channel(`timeline-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => fetchPosts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reactions' }, () => fetchPosts())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'defis' }, () => fetchDefis())
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [supabase, fetchPosts, fetchDefis])

  const feedItems: FeedItem[] = useMemo(() => [
    ...posts.map(p => ({ kind: 'post' as const, id: p.id, created_at: p.created_at, data: p })),
    ...defis.map(d => ({ kind: 'defi' as const, id: d.id, created_at: d.created_at, data: d })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()), [posts, defis])

  return (
    <div className="space-y-0">
      {/* Barre de composition style Facebook en haut */}
      <ComposeBar
        onPosted={fetchPosts}
        userEmail={currentUser.email}
        userProfile={userProfile}
      />

      {/* Feed */}
      {feedItems.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-10 text-center">
          <p className="font-caveat text-2xl text-terracotta mb-2">
            Soyez les premiers à partager quelque chose !
          </p>
          <p className="text-sm text-ink-soft font-manrope">
            Écrivez un message, partagez une photo ou un vocal ♡
          </p>
        </div>
      ) : (
        feedItems.map(item =>
          item.kind === 'post' ? (
            <PostCard key={`post-${item.id}`} post={item.data} currentUser={currentUser} />
          ) : item.data.type === 'mot' ? (
            <MotCard key={`defi-${item.id}`} defi={item.data} currentUserId={currentUser.id} onRepondu={fetchDefis} />
          ) : (
            <DefiCard key={`defi-${item.id}`} defi={item.data} currentUserId={currentUser.id} onRepondu={fetchDefis} />
          )
        )
      )}

      {defis.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <Link
            href="/defis"
            className="font-manrope text-sm text-terracotta hover:text-terracotta-deep font-semibold transition-colors"
          >
            Voir tous les défis →
          </Link>
        </div>
      )}
    </div>
  )
}
