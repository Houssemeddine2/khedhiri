export type JournalProfil = {
  user_id: string
  salt: string
  indice: string | null
  check_cipher: string
  created_at: string
}

export type JournalEntree = {
  id: string
  user_id: string
  titre_cipher: string | null
  contenu_cipher: string
  date: string
  created_at: string
  updated_at: string
}

export type EntreeDechiffree = {
  id: string
  titre: string
  contenu: string
  date: string
  created_at: string
}
