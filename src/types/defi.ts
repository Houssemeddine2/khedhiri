export interface ReponseDefi {
  id: string
  defi_id: string
  auteur_id: string
  auteur_nom: string
  auteur_email: string
  contenu: string
  photo_url: string | null
  correct: boolean | null
  created_at: string
}

export interface Defi {
  id: string
  auteur_id: string
  auteur_nom: string
  auteur_email: string
  type: 'defi' | 'mot'
  contenu: string
  traduction_ar: string | null
  indice: string | null
  created_at: string
  reponses: ReponseDefi[]
}
