// src/lib/conversation.ts
// Identifiant de conversation bilatérale déterministe :
// les deux UUIDs sont triés alphabétiquement et joints par '_'

export function conversationId(userId1: string, userId2: string): string {
  return [userId1, userId2].sort().join('_')
}
