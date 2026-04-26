// src/types/post.ts

export type Reaction = {
  id: string
  post_id: string
  user_id: string
  emoji: string
  created_at: string
}

export type PostProfile = {
  email: string
  nom: string
}

export type Post = {
  id: string
  author_id: string
  type: 'text' | 'photo' | 'audio'
  content: string | null
  media_url: string | null
  audio_duration: number | null
  created_at: string
  reactions: Reaction[]
  profiles: PostProfile | null
}

export type CurrentUser = {
  id: string
  email: string
}
