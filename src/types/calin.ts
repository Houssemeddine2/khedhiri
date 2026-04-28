// src/types/calin.ts
// Types pour le bouton câlin virtuel (étape 15)

export interface Vocal {
  id: string
  proprietaire_id: string
  titre: string
  vocal_url: string // signed URL générée côté API (expire 30 min)
  duree_sec: number | null
  created_at: string
}

export interface Calin {
  id: string
  expediteur_id: string
  expediteur_nom: string
  expediteur_email: string
  destinataire_id: string
  vocal_url: string // signed URL générée côté API (expire 30 min)
  titre: string
  envoye_at: string
  ecoute_at: string | null
}
