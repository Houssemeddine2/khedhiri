export type TutorSession = {
  id: string
  user_id: string
  titre: string | null
  created_at: string
  updated_at: string
}

export type TutorMessage = {
  id: string
  session_id: string
  user_id: string
  role: 'user' | 'assistant'
  content: string
  image_url: string | null
  created_at: string
}

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system'
  content: string | Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }>
}
