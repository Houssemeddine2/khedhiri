'use client'

import { createContext, useContext, useState } from 'react'

interface ChatContextValue {
  openUserId: string | null
  openChat: (userId: string) => void
  closeChat: () => void
}

const ChatContext = createContext<ChatContextValue>({
  openUserId: null,
  openChat: () => {},
  closeChat: () => {},
})

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [openUserId, setOpenUserId] = useState<string | null>(null)
  return (
    <ChatContext.Provider value={{
      openUserId,
      openChat: (id) => setOpenUserId(prev => prev === id ? null : id),
      closeChat: () => setOpenUserId(null),
    }}>
      {children}
    </ChatContext.Provider>
  )
}

export const useChat = () => useContext(ChatContext)
