export type Souvenir = {
  id: string
  user_id: string
  titre: string
  texte: string | null
  photo_url: string | null
  audio_url: string | null
  creation_id: string | null
  date_souvenir: string
  created_at: string
  profiles: { email: string; nom: string; avatar_url?: string | null; couleur?: string | null } | null
  creations: { media_url: string; title: string | null } | null
}
