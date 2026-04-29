'use client'

import { useCall } from '@/contexts/CallContext'
import { useEffect, useRef, useState } from 'react'

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

export default function VideoCallOverlay() {
  const { status, callType, peer, startedAt, muted, videoEnabled, localStream, remoteStream, hangUp, toggleMute, toggleVideo } = useCall()
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const localVideoRef  = useRef<HTMLVideoElement>(null)
  const duration = useDuration(status === 'active' ? startedAt : null)

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [remoteStream])

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  if (callType !== 'video' || (status !== 'calling' && status !== 'active')) return null

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col">
      {/* Vidéo distante (plein écran) */}
      <div className="flex-1 relative">
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4">
            <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center animate-pulse">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M23 7 16 12 23 17z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
              </svg>
            </div>
            <p className="font-fraunces italic text-white text-2xl">{peer?.name}</p>
            <p className="font-manrope text-white/70 text-sm">
              {status === 'calling' ? 'Appel en cours…' : `Connexion…`}
            </p>
          </div>
        )}

        {/* Durée */}
        {status === 'active' && (
          <div className="absolute top-4 left-0 right-0 flex justify-center">
            <span className="bg-black/40 backdrop-blur-sm text-white text-sm font-manrope px-3 py-1 rounded-full">
              {peer?.name} — {duration}
            </span>
          </div>
        )}

        {/* Vidéo locale (PiP coin bas-droite) */}
        <div className="absolute bottom-24 right-4 w-28 h-40 rounded-2xl overflow-hidden shadow-xl border-2 border-white/20 bg-black/60">
          {localStream && videoEnabled ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="1" y1="1" x2="23" y2="23"/>
                <path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34"/>
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Barre de contrôles */}
      <div className="flex items-center justify-center gap-5 py-6 bg-black/60 backdrop-blur-sm">
        {/* Micro */}
        <button
          onClick={toggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${muted ? 'bg-red-500' : 'bg-white/20 hover:bg-white/30'}`}
          aria-label={muted ? 'Réactiver le micro' : 'Couper le micro'}
        >
          {muted ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="1" y1="1" x2="23" y2="23"/>
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/>
              <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          )}
        </button>

        {/* Caméra */}
        <button
          onClick={toggleVideo}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${!videoEnabled ? 'bg-red-500' : 'bg-white/20 hover:bg-white/30'}`}
          aria-label={videoEnabled ? 'Couper la caméra' : 'Allumer la caméra'}
        >
          {videoEnabled ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M23 7 16 12 23 17z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M16 16 2 16a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h9.34M23 7l-7 5 7 5V7z"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          )}
        </button>

        {/* Raccrocher */}
        <button
          onClick={hangUp}
          className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors active:scale-95 shadow-lg"
          aria-label="Raccrocher"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
