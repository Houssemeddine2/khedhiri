'use client'

import { useCall } from '@/contexts/CallContext'
import AvatarCircle from '@/components/ui/AvatarCircle'
import { MEMBRES } from '@/lib/membres'

export default function IncomingCallAlert() {
  const { status, callType, peer, acceptCall, rejectCall } = useCall()

  if (status !== 'receiving' || !peer) return null

  const membre = MEMBRES.find(m => m.id === peer.id)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Fond flou */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Carte d'appel */}
      <div className="relative bg-white rounded-3xl shadow-2xl p-8 flex flex-col items-center gap-5 w-full max-w-xs animate-bounce-in">
        {/* Animation pulsante */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-olive/20 animate-ping" />
          <AvatarCircle
            email={membre?.email ?? ''}
            nom={peer.name}
            size="xl"
          />
        </div>

        <div className="text-center">
          <p className="font-fraunces italic text-terracotta text-2xl">{peer.name}</p>
          <p className="font-caveat text-ink-soft text-lg mt-0.5">
            {callType === 'video' ? 'Appel vidéo entrant…' : 'Appel vocal entrant…'}
          </p>
        </div>

        <div className="flex items-center gap-6 mt-2">
          {/* Refuser */}
          <button
            onClick={rejectCall}
            className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 active:scale-95 transition-all"
            aria-label="Refuser l'appel"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          {/* Accepter */}
          <button
            onClick={acceptCall}
            className="w-16 h-16 rounded-full bg-olive text-white flex items-center justify-center shadow-lg hover:bg-olive/80 active:scale-95 transition-all"
            aria-label="Accepter l'appel"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.13 6.13l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
