// src/components/tutor/VocalButton.tsx
'use client'

import { useCallback, useEffect, useRef } from 'react'

interface VocalButtonProps {
  isListening: boolean
  onStart: () => void
  onStop: () => void
  disabled?: boolean
}

export default function VocalButton({ isListening, onStart, onStop, disabled }: VocalButtonProps) {
  const pressRef = useRef(false)

  function handlePointerDown(e: React.PointerEvent) {
    e.preventDefault()
    if (disabled) return
    pressRef.current = true
    onStart()
  }

  const handlePointerUp = useCallback(() => {
    if (!pressRef.current) return
    pressRef.current = false
    onStop()
  }, [onStop])

  useEffect(() => {
    window.addEventListener('pointerup', handlePointerUp)
    return () => window.removeEventListener('pointerup', handlePointerUp)
  }, [handlePointerUp])

  return (
    <button
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      disabled={disabled}
      aria-label={isListening ? 'Enregistrement en cours — relâche pour envoyer' : 'Maintiens pour parler'}
      className={`
        flex-1 h-11 rounded-full flex items-center justify-center gap-2
        font-manrope font-semibold text-sm text-white select-none
        transition-all duration-150 disabled:opacity-40
        ${isListening
          ? 'bg-terracotta-deep scale-95 shadow-inner'
          : 'bg-terracotta shadow-md active:scale-95'}
      `}
    >
      <span className={`text-lg ${isListening ? 'animate-pulse' : ''}`}>🎤</span>
      <span>{isListening ? 'Écoute…' : 'Maintiens pour parler'}</span>
      {isListening && (
        <span className="flex gap-0.5 items-end ml-1">
          {[8, 14, 10].map((h, i) => (
            <span
              key={i}
              className="w-1 bg-white/80 rounded-full animate-bounce"
              style={{ height: h, animationDelay: `${i * 150}ms` }}
            />
          ))}
        </span>
      )}
    </button>
  )
}
