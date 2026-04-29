'use client'

import { useCall } from '@/contexts/CallContext'
import { useEffect, useState } from 'react'

function useDuration(startedAt: Date | null) {
  const [secs, setSecs] = useState(0)
  useEffect(() => {
    if (!startedAt) { setSecs(0); return }
    const tick = () => setSecs(Math.floor((Date.now() - startedAt.getTime()) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [startedAt])
  const m = String(Math.floor(secs / 60)).padStart(2, '0')
  const s = String(secs % 60).padStart(2, '0')
  return `${m}:${s}`
}

export default function ActiveCallBar() {
  const { status, callType, peer, startedAt, muted, hangUp, toggleMute, callError } = useCall()
  const duration = useDuration(status === 'active' ? startedAt : null)

  if (callError) return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] bg-red-500 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium animate-fade-in">
      {callError}
    </div>
  )

  if ((status !== 'calling' && status !== 'active') || callType === 'video') return null

  return (
    <div className="fixed top-14 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div className="flex items-center gap-3 bg-olive text-white px-4 py-2 rounded-full shadow-lg pointer-events-auto mt-2 animate-fade-in">
        {/* Point animé */}
        <span className="w-2 h-2 rounded-full bg-white/80 animate-pulse flex-shrink-0" aria-hidden="true" />

        {/* Info */}
        <span className="font-manrope text-sm font-medium">
          {status === 'calling'
            ? `Appel vers ${peer?.name}…`
            : `${peer?.name} — ${duration}`}
        </span>

        {/* Couper le micro */}
        {status === 'active' && (
          <button
            onClick={toggleMute}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${muted ? 'bg-white/30' : 'bg-white/10 hover:bg-white/20'}`}
            aria-label={muted ? 'Réactiver le micro' : 'Couper le micro'}
          >
            {muted ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="1" y1="1" x2="23" y2="23"/>
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/>
                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            )}
          </button>
        )}

        {/* Raccrocher */}
        <button
          onClick={hangUp}
          className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors active:scale-95"
          aria-label="Raccrocher"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
