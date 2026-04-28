// src/types/quiz.ts
// Types pour étape 18: Quiz et Jeux personnalisés

export interface SessionMembre {
  session_id: string
  membre_id: string
  membre_nom: string
  membre_email: string
  score: number
  nb_questions: number
  termine_at: string
}

export interface Quiz {
  id: string
  auteur_id: string
  auteur_nom: string
  auteur_email: string
  titre: string
  description: string | null
  assignees: string[]
  created_at: string
  sessions: SessionMembre[]
  nb_questions: number
  a_joue: boolean
}

// bonne_reponse intentionnellement absent : jamais exposé au client
export interface QuestionQuiz {
  id: string
  quiz_id: string
  type: 'qcm' | 'vrai_faux' | 'ouverte'
  contenu: string
  options: string[] | null
  ordre: number
}

export interface ReponseQuizInput {
  question_id: string
  contenu: string
}

export interface ReponseOuverteAValider {
  id: string
  session_id: string
  question_id: string
  question_contenu: string
  membre_nom: string
  membre_email: string
  contenu: string
  correct: boolean | null
}
