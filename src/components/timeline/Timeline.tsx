'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import PostCard from './PostCard'
import ComposeBar from './ComposeBar'
import type { Post, CurrentUser } from '@/types/post'

interface TimelineProps {
  initialPosts: Post[]
  currentUser: CurrentUser
  supabaseUrl: string
  supabaseAnonKey: string
}

export default function Timeline({
  initialPosts,
  currentUser,
  supabaseUrl,
  supabaseAnonKey,
}: TimelineProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts)

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

  useEffect(() => {
    fetchPosts()

    const channel = supabase
      .channel('timeline')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => fetchPosts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reactions' }, () => fetchPosts())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, fetchPosts])

  return (
    <div className="min-h-screen bg-cream pb-32">
      {/* En-tête */}
      <h1 className="font-fraunces italic text-terracotta text-center text-2xl pt-8 pb-4">
        La famille Khedhiri ♡
      </h1>

      {/* Liste des posts */}
      <div className="mx-auto max-w-lg px-4">
        {posts.length > 0 ? (
          posts.map((post) => (
            <PostCard key={post.id} post={post} currentUser={currentUser} />
          ))
        ) : (
          <p className="font-caveat text-center text-ink-soft text-xl mt-16">
            Soyez les premiers à partager quelque chose ♡
          </p>
        )}
      </div>

      {/* Barre de composition — sticky via son propre layout */}
      <ComposeBar onPosted={fetchPosts} />
    </div>
  )
}
