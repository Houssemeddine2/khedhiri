export type Creation = {
  id: string
  author_id: string
  title: string | null
  media_url: string
  created_at: string
  profiles: { email: string; nom: string; avatar_url?: string | null; couleur?: string | null } | null
}
