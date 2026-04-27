export type MembreFamille = {
  id: string
  prenom: string
  nom: string | null
  surnom: string | null
  photo_url: string | null
  date_naissance: string | null
  lieu_naissance: string | null
  cote: 'khedhiri' | 'maternel'
  relation: string
  generation: number
  bio: string | null
  created_by: string
  created_at: string
}

export type Anecdote = {
  id: string
  membre_id: string
  user_id: string
  contenu: string
  created_at: string
  profiles: { email: string; nom: string; avatar_url?: string | null; couleur?: string | null } | null
}
