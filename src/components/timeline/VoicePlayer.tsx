'use client'

import { useRef, useState } from 'react'
import { formatDuree } from '@/lib/avatar'

interface VoicePlayerProps {
  url: string
  duration: number | null
}

export default function VoicePlayer({ url, duration }: VoicePlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const handlePlayPause = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const handleEnded = () => {
    setIsPlaying(false)
  }

  // Waveform bars: 24 bars with heights computed by sine function
  const bars = Array.from({ length: 24 }, (_, i) => {
    const height = Math.abs(Math.sin(i * 0.8)) * 24 + 8
    return height
  })

  return (
    <div className="flex items-center gap-4 bg-jasmine rounded-2xl px-4 py-3">
      {/* Play/Pause Button */}
      <button
        onClick={handlePlayPause}
        aria-label={isPlaying ? 'Mettre en pause' : 'Lire le message vocal'}
        className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-terracotta hover:bg-terracotta-deep transition-colors"
      >
        {isPlaying ? (
          // Pause icon: two vertical bars
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="3" y="2" width="2" height="12" fill="white" rx="0.5" />
            <rect x="11" y="2" width="2" height="12" fill="white" rx="0.5" />
          </svg>
        ) : (
          // Play icon: triangle
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M3 1L14 8L3 15V1Z" fill="white" />
          </svg>
        )}
      </button>

      {/* Waveform */}
      <div className="flex-1 flex items-center gap-1">
        {bars.map((height, i) => (
          <div
            key={i}
            className={`w-[3px] rounded transition-opacity ${
              isPlaying ? 'opacity-100' : 'opacity-60'
            } bg-terracotta`}
            style={{ height: `${height}px` }}
          />
        ))}
      </div>

      {/* Duration */}
      <div className="text-sm text-ink font-medium flex-shrink-0">
        {formatDuree(duration ?? 0)}
      </div>

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={url}
        onEnded={handleEnded}
        preload="metadata"
      />
    </div>
  )
}
