// src/components/calins/VocalRecorder.tsx
'use client'

import { useRef, useState, useEffect, useCallback } from 'react'

interface Props {
  onRecorded: (blob: Blob, dureeSec: number) => void
  maxSec?: number
}

export default function VocalRecorder({ onRecorded, maxSec = 60 }: Props) {
  const [isRecording, setIsRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const mrRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stop = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    mrRef.current?.stop()
    setIsRecording(false)
  }, [])

  useEffect(() => () => { stop() }, [stop])

  const toggle = async () => {
    if (isRecording) { stop(); return }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      mrRef.current = mr
      chunksRef.current = []
      startRef.current = Date.now()
      setElapsed(0)

      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        const dureeSec = Math.round((Date.now() - startRef.current) / 1000)
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        stream.getTracks().forEach(t => t.stop())
        onRecorded(blob, dureeSec)
        setElapsed(0)
      }

      mr.start()
      setIsRecording(true)

      timerRef.current = setInterval(() => {
        setElapsed(prev => {
          const next = prev + 1
          if (next >= maxSec) stop()
          return next
        })
      }, 1000)
    } catch {
      // microphone non disponible ou permission refusée
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isRecording ? `Arrêter l'enregistrement (${elapsed}s)` : "Démarrer l'enregistrement vocal"}
      className={`flex items-center gap-2 px-4 py-2 rounded-full font-manrope font-semibold text-sm text-white transition-all select-none ${
        isRecording
          ? 'bg-terracotta-deep'
          : 'bg-terracotta hover:bg-terracotta-deep'
      }`}
    >
      <span className={isRecording ? 'animate-pulse' : ''}>🎤</span>
      <span>
        {isRecording ? `${elapsed}s / ${maxSec}s — Arrêter` : 'Enregistrer un vocal'}
      </span>
    </button>
  )
}
