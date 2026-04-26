'use client'

import { useState, useRef, useEffect } from 'react'
import { uploadMedia, createMediaPost } from '@/app/actions/posts'
import { formatDuree } from '@/lib/avatar'

interface VoiceRecorderProps {
  onDone: () => void
  onCancel: () => void
}

export default function VoiceRecorder({ onDone, onCancel }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [isPending, setIsPending] = useState(false)

  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const secondsRef = useRef<number>(0)
  const streamRef = useRef<MediaStream | null>(null)
  const cancelledRef = useRef<boolean>(false)

  // Minuterie : incrémente `seconds` chaque seconde pendant l'enregistrement
  useEffect(() => {
    if (!isRecording) return
    const interval = setInterval(() => {
      setSeconds((s) => {
        const next = s + 1
        secondsRef.current = next
        return next
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [isRecording])

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mimeType = (typeof MediaRecorder !== 'undefined' &&
        MediaRecorder.isTypeSupported('audio/webm;codecs=opus'))
        ? 'audio/webm;codecs=opus'
        : 'audio/mp4'

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorder.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data)
      }

      recorder.onstop = async () => {
        if (cancelledRef.current) { cancelledRef.current = false; return }
        const blob = new Blob(chunks.current, { type: mimeType })
        chunks.current = []
        setIsPending(true)
        try {
          const formData = new FormData()
          formData.append('file', blob, 'vocal.webm')
          const mediaUrl = await uploadMedia(formData)
          await createMediaPost('audio', mediaUrl, secondsRef.current)
          setIsPending(false)
          onDone()
        } catch (err) {
          setIsPending(false)
          console.error('Erreur lors de l\'envoi du message vocal :', err)
        }
        streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null
      }

      secondsRef.current = 0
      setSeconds(0)
      cancelledRef.current = false
      recorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error('Impossible d\'accéder au microphone:', err)
      alert('Impossible d\'accéder au microphone. Vérifiez les permissions.')
    }
  }

  function stopRecording() {
    mediaRecorder.current?.stop()
    setIsRecording(false)
  }

  function handleCancel() {
    cancelledRef.current = true
    mediaRecorder.current?.stop()
    streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null
    chunks.current = []
    secondsRef.current = 0
    onCancel()
  }

  // État : envoi en cours
  if (isPending) {
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <p className="font-manrope text-ink-soft text-sm animate-pulse">Envoi...</p>
      </div>
    )
  }

  // État : enregistrement en cours
  if (isRecording) {
    return (
      <div className="flex flex-col items-center gap-4 py-4">
        {/* Minuterie */}
        <p className="font-manrope text-2xl font-semibold text-ink tabular-nums">
          {formatDuree(seconds)}
        </p>

        {/* Bouton stop — cercle rouge pulsant */}
        <button
          onClick={stopRecording}
          aria-label="Arrêter l'enregistrement"
          className="w-20 h-20 rounded-full bg-terracotta shadow-lg flex items-center justify-center animate-pulse focus:outline-none focus:ring-4 focus:ring-terracotta/50 active:scale-95 transition-transform"
        >
          {/* Icône carré (stop) */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-8 h-8 text-white"
            aria-hidden="true"
          >
            <rect x="5" y="5" width="14" height="14" rx="2" />
          </svg>
        </button>

        {/* Annuler */}
        <button
          onClick={handleCancel}
          className="font-manrope text-sm text-ink-soft underline underline-offset-2 hover:text-terracotta transition-colors focus:outline-none focus:ring-2 focus:ring-terracotta/40 rounded"
        >
          Annuler
        </button>
      </div>
    )
  }

  // État initial : prêt à enregistrer
  return (
    <div className="flex flex-col items-center gap-4 py-4">
      {/* Bouton enregistrement — grand cercle rouge */}
      <button
        onClick={startRecording}
        aria-label="Commencer l'enregistrement"
        className="w-20 h-20 rounded-full bg-terracotta shadow-lg flex items-center justify-center hover:bg-terracotta-deep focus:outline-none focus:ring-4 focus:ring-terracotta/50 active:scale-95 transition-all"
      >
        {/* Icône micro */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-9 h-9 text-white"
          aria-hidden="true"
        >
          {/* Corps du micro */}
          <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4z" />
          {/* Arc extérieur */}
          <path d="M19 10a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.93V20H9a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-3.07A7 7 0 0 0 19 10z" />
        </svg>
      </button>

      <p className="font-manrope text-sm text-ink-soft">
        Appuyer pour enregistrer
      </p>

      {/* Annuler */}
      <button
        onClick={handleCancel}
        className="font-manrope text-sm text-ink-soft underline underline-offset-2 hover:text-terracotta transition-colors focus:outline-none focus:ring-2 focus:ring-terracotta/40 rounded"
      >
        Annuler
      </button>
    </div>
  )
}
