// src/types/lecture.ts

export interface AvancementMembre {
  membre_id: string
  membre_nom: string
  membre_email: string
  statut: 'pas_commence' | 'en_cours' | 'termine'
}

export interface ReponseQuestion {
  id: string
  question_id: string
  auteur_id: string
  auteur_nom: string
  auteur_email: string
  contenu: string
  created_at: string
}

export interface QuestionLecture {
  id: string
  lecture_id: string
  auteur_id: string
  auteur_nom: string
  auteur_email: string
  contenu: string
  created_at: string
  reponses: ReponseQuestion[]
}

export interface Lecture {
  id: string
  auteur_id: string
  auteur_nom: string
  auteur_email: string
  titre: string
  auteur_livre: string
  description: string | null
  couverture_url: string | null
  assignees: string[]
  created_at: string
  avancements: AvancementMembre[]
  nb_questions: number
}

export interface GoogleBooksResult {
  titre: string
  auteur: string
  description: string | null
  couverture_url: string | null
}
