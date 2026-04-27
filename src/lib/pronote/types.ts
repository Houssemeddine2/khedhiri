export interface PronoteNote {
  matiere: string
  note: number
  noteMax: number
  date: string        // ISO date string
  commentaire?: string
}

export interface PronoteDevoir {
  matiere: string
  description: string
  dateRendu: string   // ISO date string
  fait: boolean
}

export interface PronoteAbsence {
  dateDebut: string   // ISO datetime string
  dateFin: string
  justifiee: boolean
  cours?: string
}

export interface PronoteObservation {
  prof?: string
  matiere?: string
  contenu: string
  date: string        // ISO date string
}

export interface PronoteEvenement {
  titre: string
  type: 'controle' | 'sortie' | 'reunion' | 'autre'
  dateDebut: string   // ISO datetime string
  dateFin?: string
}

export interface PronoteDonnees {
  notes: PronoteNote[]
  devoirs: PronoteDevoir[]
  absences: PronoteAbsence[]
  observations: PronoteObservation[]
  evenements: PronoteEvenement[]
}
