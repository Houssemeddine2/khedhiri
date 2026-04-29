'use client'

import { useChat } from '@/contexts/ChatContext'
import AvatarCircle from '@/components/ui/AvatarCircle'

interface ChatTriggerProps {
  userId: string
  email: string
  nom?: string | null
  avatarUrl?: string | null
  couleur?: string | null
}

export default function ChatTrigger({ userId, email, nom, avatarUrl, couleur }: ChatTriggerProps) {
  const { openChat, openUserId } = useChat()
  return (
    <button
      onClick={() => openChat(userId)}
      className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${openUserId === userId ? 'bg-sand ring-2 ring-terracotta/30' : 'hover:bg-sand'}`}
      aria-label={`Ouvrir la conversation avec ${nom ?? email}`}
      title={nom ?? email}
    >
      <AvatarCircle email={email} nom={nom} avatarUrl={avatarUrl} couleur={couleur} size="md" />
    </button>
  )
}
