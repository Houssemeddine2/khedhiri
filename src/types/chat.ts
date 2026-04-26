// src/types/chat.ts

export type Message = {
  id: string
  conversation_id: string
  sender_id: string
  type: 'text' | 'photo' | 'audio'
  content: string | null
  media_url: string | null
  audio_duration: number | null
  created_at: string
}

export type ChatMembre = {
  id: string
  nom: string
  email: string
}
