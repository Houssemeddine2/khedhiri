'use client'

import { useChat } from '@/contexts/ChatContext'
import AvatarCircle from '@/components/ui/AvatarCircle'

interface ChatRowTriggerProps {
  userId: string
  email: string
  nom?: string | null
  avatarUrl?: string | null
  couleur?: string | null
}

export default function ChatRowTrigger({ userId, email, nom, avatarUrl, couleur }: ChatRowTriggerProps) {
  const { openChat } = useChat()
  return (
    <button
      onClick={() => openChat(userId)}
      className="flex items-center gap-3 p-2 rounded-xl hover:bg-sand transition-colors group min-h-[44px] w-full text-left"
    >
      <AvatarCircle email={email} nom={nom} avatarUrl={avatarUrl} couleur={couleur} size="md" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-ink text-sm group-hover:text-terracotta transition-colors truncate">
          {nom ?? email.split('@')[0]}
        </p>
        <p className="text-xs text-ink-soft">Envoyer un message</p>
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink-soft/40 flex-shrink-0" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    </button>
  )
}
