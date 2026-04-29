'use client'

import { useState } from 'react'
import { useChat } from '@/contexts/ChatContext'

interface Member { id: string; nom: string; email: string }

export default function ChatFab({ members }: { members: Member[] }) {
  const { openChat } = useChat()
  const [open, setOpen] = useState(false)

  function handleMember(id: string) {
    openChat(id)
    setOpen(false)
  }

  const isGirl = (email: string) =>
    email.includes('sandra') || email.includes('sarah')

  return (
    <>
      {/* Mini picker au-dessus du FAB */}
      {open && members.length > 1 && (
        <>
          <div
            className="fixed inset-0 z-40 md:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            className="fixed md:hidden z-50 flex flex-col gap-2"
            style={{ bottom: 128, right: 12 }}
          >
            {members.map(m => {
              const girl = isGirl(m.email)
              const gradient = girl
                ? 'linear-gradient(135deg, #C5563D, #D4A04C)'
                : 'linear-gradient(135deg, #2E5C8A, #6B7B3F)'
              const textColor = girl ? '#C5563D' : '#2E5C8A'
              return (
                <button
                  key={m.id}
                  onClick={() => handleMember(m.id)}
                  className="flex items-center gap-2 self-end active:scale-95 transition-transform"
                  aria-label={`Chat avec ${m.nom}`}
                >
                  <span
                    className="bg-white rounded-full px-3 py-1 shadow-md font-manrope font-semibold"
                    style={{ fontSize: 12, color: '#2A1F18' }}
                  >
                    {m.nom}
                  </span>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: gradient, padding: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,.2)' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: textColor }}>
                      {m.nom.slice(0, 2)}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}

      {/* FAB */}
      <button
        onClick={() => members.length === 1 ? handleMember(members[0].id) : setOpen(v => !v)}
        aria-label="Ouvrir un chat"
        className="fixed md:hidden z-50 flex items-center justify-center rounded-full active:scale-95 transition-transform"
        style={{
          width: 48,
          height: 48,
          bottom: 72,
          right: 16,
          background: 'linear-gradient(135deg, #C5563D, #e8735a)',
          boxShadow: '0 4px 16px rgba(197,86,61,.5)',
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </button>
    </>
  )
}
