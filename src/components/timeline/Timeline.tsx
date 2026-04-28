'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
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
  supabaseUrl: string
  supabaseAnonKey: string
}

type FeedItem =
  | { kind: 'post'; id: string; created_at: string; data: Post }
  | { kind: 'defi'; id: string; created_at: string; data: Defi }

export default function Timeline({
  initialPosts,
  currentUser,
  supabaseUrl,
  supabaseAnonKey,
}: TimelineProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [defis, setDefis] = useState<Defi[]>([])

  const supabase = useMemo(
    () => createBrowserClient(supabaseUrl, supabaseAnonKey),
    [supabaseUrl, supabaseAnonKey]
  )

  const fetchPosts = useCallback(async () => {
    const { data } = await supabase
      .from('posts')
      .select('*, reactions(*), profiles(email, nom)')
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

    const channel = supabase
      .channel('timeline')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => fetchPosts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reactions' }, () => fetchPosts())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'defis' }, () => fetchDefis())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase, fetchPosts, fetchDefis])

  const feedItems: FeedItem[] = useMemo(() => [
    ...posts.map(p => ({ kind: 'post' as const, id: p.id, created_at: p.created_at, data: p })),
    ...defis.map(d => ({ kind: 'defi' as const, id: d.id, created_at: d.created_at, data: d })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()), [posts, defis])

  return (
    <div className="min-h-screen bg-cream pb-32">
      <h1 className="font-fraunces italic text-terracotta text-center text-2xl pt-8 pb-4">
        La famille Khedhiri ♡
      </h1>

      <div className="mx-auto max-w-lg px-4">
        {feedItems.length > 0 ? (
          feedItems.map(item =>
            item.kind === 'post' ? (
              <PostCard key={`post-${item.id}`} post={item.data} currentUser={currentUser} />
            ) : item.data.type === 'mot' ? (
              <MotCard key={`defi-${item.id}`} defi={item.data} currentUserId={currentUser.id} onRepondu={fetchDefis} />
            ) : (
              <DefiCard key={`defi-${item.id}`} defi={item.data} currentUserId={currentUser.id} onRepondu={fetchDefis} />
            )
          )
        ) : (
          <p className="font-caveat text-center text-ink-soft text-xl mt-16">
            Soyez les premiers à partager quelque chose ♡
          </p>
        )}

        {defis.length > 0 && (
          <div className="text-center mt-4 mb-8">
            <Link
              href="/defis"
              className="font-manrope text-sm text-terracotta hover:text-terracotta-deep underline underline-offset-2 transition-colors"
            >
              Voir tous les défis →
            </Link>
          </div>
        )}
      </div>

      <ComposeBar onPosted={fetchPosts} />
    </div>
  )
}
