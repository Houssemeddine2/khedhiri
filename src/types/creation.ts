export type Creation = {
  id: string
  author_id: string
  title: string | null
  media_url: string
  created_at: string
  profiles: { email: string; nom: string } | null
}
