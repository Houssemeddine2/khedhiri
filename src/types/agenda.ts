export type Evenement = {
  id: string
  author_id: string
  title: string
  date: string        // YYYY-MM-DD
  description: string | null
  color: string
  created_at: string
}

export type CompteARebours = {
  id: string
  author_id: string
  title: string
  target_date: string // YYYY-MM-DD
  emoji: string
  created_at: string
}
