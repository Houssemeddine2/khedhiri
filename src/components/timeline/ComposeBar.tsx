'use client'

import { useState, useRef, useTransition } from 'react'
import { createTextPost, uploadMedia, createMediaPost } from '@/app/actions/posts'
import VoiceRecorder from './VoiceRecorder'

interface ComposeBarProps {
  onPosted: () => void
}

export default function ComposeBar({ onPosted }: ComposeBarProps) {
  const [text, setText] = useState('')
  const [mode, setMode] = useState<'text' | 'voice'>('text')
  const [isPending, startTransition] = useTransition()
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmitText = () => {
    if (!text.trim() || isPending) return

    startTransition(async () => {
      try {
        await createTextPost(text.trim())
        setText('')
        onPosted()
      } catch (err) {
        console.error('Erreur lors de l\'envoi du message:', err)
      }
    })
  }

  const handlePhotoClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0]
    if (!file) return

    setIsUploadingPhoto(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const mediaUrl = await uploadMedia(formData)
      await createMediaPost('photo', mediaUrl)
      onPosted()
      // Réinitialiser l'input
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      console.error('Erreur lors de l\'upload de la photo:', err)
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  // Mode vocal
  if (mode === 'voice') {
    return (
      <div className="sticky bottom-0 left-0 right-0 bg-cream border-t border-terracotta/20 p-4">
        <div className="mx-auto max-w-lg">
          <VoiceRecorder
            onDone={() => {
              setMode('text')
              onPosted()
            }}
            onCancel={() => setMode('text')}
          />
        </div>
      </div>
    )
  }

  // Mode texte (défaut)
  return (
    <div className="sticky bottom-0 left-0 right-0 bg-cream border-t border-terracotta/20 p-4">
      <div className="mx-auto max-w-lg">
        {/* Textarea */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Dis quelque chose à la famille ♡"
          rows={3}
          className="w-full px-4 py-3 font-manrope text-ink bg-white border border-terracotta/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta/50 resize-none"
        />

        {/* Boutons */}
        <div className="flex items-center justify-between mt-3 gap-2">
          {/* Photo et Mic à gauche */}
          <div className="flex gap-2">
            {/* Photo button */}
            <button
              onClick={handlePhotoClick}
              disabled={isUploadingPhoto || isPending}
              aria-label="Ajouter une photo"
              className="p-2 rounded-lg hover:bg-terracotta/10 focus:outline-none focus:ring-2 focus:ring-terracotta/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {/* Icône appareil photo */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-6 h-6 text-terracotta"
                aria-hidden="true"
              >
                <path d="M12 2c1.1 0 2 .9 2 2v1h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4V4c0-1.1.9-2 2-2z" />
                <circle cx="12" cy="12" r="4" fill="white" />
              </svg>
            </button>

            {/* Voice button */}
            <button
              onClick={() => setMode('voice')}
              disabled={isPending || isUploadingPhoto}
              aria-label="Enregistrement vocal"
              className="p-2 rounded-lg hover:bg-terracotta/10 focus:outline-none focus:ring-2 focus:ring-terracotta/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {/* Icône micro */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-6 h-6 text-terracotta"
                aria-hidden="true"
              >
                <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4z" />
                <path d="M19 10a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.93V20H9a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-3.07A7 7 0 0 0 19 10z" />
              </svg>
            </button>
          </div>

          {/* Submit button à droite */}
          <button
            onClick={handleSubmitText}
            disabled={!text.trim() || isPending || isUploadingPhoto}
            className="px-4 py-2 font-manrope font-medium text-white bg-terracotta rounded-lg hover:bg-terracotta-deep focus:outline-none focus:ring-2 focus:ring-terracotta/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Envoi...' : 'Partager'}
          </button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelected}
          className="hidden"
          aria-hidden="true"
        />
      </div>
    </div>
  )
}
