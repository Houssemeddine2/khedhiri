export interface LettreMetadata {
  id: string
  auteur_id: string
  destinataire_id: string
  titre: string
  unlock_at: string
  lue_at: string | null
  created_at: string
}

export interface LettreDecouverte extends LettreMetadata {
  contenu: string
}

export interface LettrePapa {
  id: string
  destinataire_id: string
  titre: string
  contenu: string
  unlock_at: string
  notif_envoyee: boolean
  lue_at: string | null
  created_at: string
  updated_at: string
}
