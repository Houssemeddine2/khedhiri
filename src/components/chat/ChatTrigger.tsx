'use client'

import { useChat } from '@/contexts/ChatContext'

interface ChatTriggerProps {
  userId: string
  email: string
  nom?: string | null
  avatarUrl?: string | null
  couleur?: string | null
}

function isGirl(email: string) {
  return email.includes('sandra') || email.includes('sarah')
}

export default function ChatTrigger({ userId, email, nom }: ChatTriggerProps) {
  const { openChat, openUserId } = useChat()
  const girl = isGirl(email)
  const gradient = girl
    ? 'linear-gradient(135deg, #C5563D, #D4A04C)'
    : 'linear-gradient(135deg, #2E5C8A, #6B7B3F)'
  const textColor = girl ? '#C5563D' : '#2E5C8A'
  const initials = (nom ?? email).slice(0, 2).toUpperCase()
  const isOpen = openUserId === userId

  return (
    <button
      onClick={() => openChat(userId)}
      aria-label={`Ouvrir la conversation avec ${nom ?? email}`}
      title={nom ?? email}
      style={{ position: 'relative', width: 40, height: 40, padding: 2, borderRadius: '50%', background: isOpen ? gradient : 'transparent', transition: 'background 0.15s', flexShrink: 0 }}
    >
      {/* Anneau gradient toujours visible */}
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: gradient, opacity: isOpen ? 1 : 0.85 }} />
      {/* Cercle blanc intérieur */}
      <div style={{ position: 'relative', width: 34, height: 34, margin: '1px auto', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: textColor, fontFamily: 'Manrope, sans-serif' }}>
        {initials}
      </div>
      {/* Point de présence vert */}
      <div style={{ position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: '50%', background: '#22c55e', border: '2px solid white' }} />
    </button>
  )
}
