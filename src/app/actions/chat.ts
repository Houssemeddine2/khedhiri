'use server'

import { createClient } from '@/lib/supabase/server'
import { conversationId } from '@/lib/conversation'

export async function sendTextMessage(otherUserId: string, content: string): Promise<void> {
  if (!content.trim()) return
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const convId = conversationId(user.id, otherUserId)
  const { error } = await supabase.from('messages').insert({
    conversation_id: convId,
    sender_id:       user.id,
    type:            'text',
    content:         content.trim(),
  })
  if (error) throw new Error(error.message)
}

export async function sendMediaMessage(
  otherUserId: string,
  type: 'photo' | 'audio',
  mediaUrl: string,
  audioDuration?: number,
): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const convId = conversationId(user.id, otherUserId)
  const { error } = await supabase.from('messages').insert({
    conversation_id: convId,
    sender_id:       user.id,
    type,
    media_url:       mediaUrl,
    audio_duration:  audioDuration ?? null,
  })
  if (error) throw new Error(error.message)
}

export async function deleteMessage(messageId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId)
    .eq('sender_id', user.id)
  if (error) throw new Error(error.message)
}
