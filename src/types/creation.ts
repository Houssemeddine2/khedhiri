export type ReactionCreation = {
  id: string
  creation_id: string
  membre_id: string
  emoji: '❤️' | '😍' | '🎉'
  created_at: string
}

export type Creation = {
  id: string
  author_id: string
  title: string | null
  media_url: string
  source: 'digital' | 'upload'
  created_at: string
  profiles: { email: string; nom: string; avatar_url?: string | null; couleur?: string | null } | null
  reactions_creations?: ReactionCreation[]
}
