'use client'

import { useRef, useState, useTransition } from 'react'
import { sendTextMessage, sendMediaMessage } from '@/app/actions/chat'
import { uploadMedia } from '@/app/actions/posts'
import VoiceRecorder from '@/components/timeline/VoiceRecorder'

interface ChatInputProps {
  otherUserId: string
  onSent: () => void
}

export default function ChatInput({ otherUserId, onSent }: ChatInputProps) {
  const [text, setText] = useState('')
  const [mode, setMode] = useState<'text' | 'voice'>('text')
  const [isPending, startTransition] = useTransition()
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleSubmit() {
    if (!text.trim()) return
    setError(null)
    startTransition(async () => {
      try {
        await sendTextMessage(otherUserId, text)
        setText('')
        onSent()
      } catch {
        setError('Impossible d\'envoyer le message. Réessaie.')
      }
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingPhoto(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const url = await uploadMedia(formData)
      await sendMediaMessage(otherUserId, 'photo', url)
      onSent()
    } catch {
      setError('Impossible d\'envoyer la photo. Réessaie.')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
      setIsUploadingPhoto(false)
    }
  }

  if (mode === 'voice') {
    return (
      <div className="bg-cream border-t border-terracotta/20 p-4">
        <VoiceRecorder
          onDone={() => { setMode('text'); onSent() }}
          onCancel={() => setMode('text')}
          onRecorded={async (url, dur) => {
            await sendMediaMessage(otherUserId, 'audio', url, dur)
          }}
        />
      </div>
    )
  }

  return (
    <div className="bg-cream border-t border-terracotta/20 p-3">
      <div className="max-w-lg mx-auto">
        {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
        <div className="flex items-end gap-2">
          {/* Bouton photo */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending || isUploadingPhoto}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-jasmine text-ink-soft hover:text-terracotta transition-colors disabled:opacity-40 flex-shrink-0"
            aria-label="Envoyer une photo"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </button>

          {/* Zone de texte */}
          <textarea
            value={text}
            onChange={e => { setText(e.target.value); setError(null) }}
            onKeyDown={handleKeyDown}
            placeholder="Écris un message ♡"
            rows={1}
            aria-label="Écris un message"
            disabled={isPending || isUploadingPhoto}
            className="flex-1 resize-none rounded-2xl border border-terracotta/20 bg-jasmine px-3 py-2 text-sm font-manrope text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-terracotta/30 disabled:opacity-50"
            style={{ minHeight: '38px', maxHeight: '120px' }}
          />

          {/* Bouton micro */}
          <button
            type="button"
            onClick={() => setMode('voice')}
            disabled={isPending || isUploadingPhoto}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-jasmine text-ink-soft hover:text-terracotta transition-colors disabled:opacity-40 flex-shrink-0"
            aria-label="Enregistrer un message vocal"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>

          {/* Bouton envoyer */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!text.trim() || isPending || isUploadingPhoto}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-terracotta text-white hover:bg-terracotta-deep transition-colors disabled:opacity-40 flex-shrink-0"
            aria-label="Envoyer"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelected}
          aria-hidden="true"
        />
      </div>
    </div>
  )
}
