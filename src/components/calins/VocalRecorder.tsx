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
  const [erreur, setErreur] = useState<string | null>(null)
  const mrRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const cancelledRef = useRef(false)

  const stop = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    cancelledRef.current = true
    mrRef.current?.stop()
    setIsRecording(false)
  }, [])

  useEffect(() => () => { stop() }, [stop])

  const toggle = async () => {
    if (isRecording) { stop(); return }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/webm'
      const mr = new MediaRecorder(stream, { mimeType })
      mrRef.current = mr
      chunksRef.current = []
      startRef.current = Date.now()
      cancelledRef.current = false
      setElapsed(0)
      setErreur(null)

      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        if (cancelledRef.current) {
          cancelledRef.current = false
          stream.getTracks().forEach(t => t.stop())
          return
        }
        const dureeSec = Math.round((Date.now() - startRef.current) / 1000)
        const blob = new Blob(chunksRef.current, { type: mimeType })
        stream.getTracks().forEach(t => t.stop())
        onRecorded(blob, dureeSec)
        setElapsed(0)
      }

      mr.start()
      setIsRecording(true)

      timerRef.current = setInterval(() => {
        setElapsed(prev => {
          const next = prev + 1
          if (next >= maxSec) {
            setTimeout(stop, 0)
          }
          return next
        })
      }, 1000)
    } catch {
      setErreur('Microphone non disponible. Vérifie les permissions.')
    }
  }

  return (
    <div>
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
      {erreur && (
        <p role="alert" className="text-xs text-terracotta font-manrope mt-1">{erreur}</p>
      )}
    </div>
  )
}
