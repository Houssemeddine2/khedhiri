'use client'

import { useState, useRef, useTransition } from 'react'
import { createTextPost, uploadMedia, createMediaPost } from '@/app/actions/posts'
import { avatarFromEmail } from '@/lib/avatar'
import AvatarCircle from '@/components/ui/AvatarCircle'
import VoiceRecorder from './VoiceRecorder'

interface ComposeBarProps {
  onPosted: () => void
  userEmail: string
  userProfile?: { nom: string | null; avatar_url: string | null; couleur: string | null }
}

export default function ComposeBar({ onPosted, userEmail, userProfile }: ComposeBarProps) {
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [mode, setMode] = useState<'text' | 'voice'>('text')
  const [isPending, startTransition] = useTransition()
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { nom: avatarNom } = avatarFromEmail(userEmail)
  const prenom = avatarNom.split(' ')[0]

  const handleSubmitText = () => {
    if (!text.trim() || isPending) return
    startTransition(async () => {
      try {
        await createTextPost(text.trim())
        setText('')
        setError(null)
        setExpanded(false)
        onPosted()
      } catch {
        setError('Impossible d\'envoyer. Réessaie.')
      }
    })
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
      setError(null)
      onPosted()
    } catch {
      setError('Impossible d\'envoyer la photo. Réessaie.')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
      setIsUploadingPhoto(false)
    }
  }

  if (mode === 'voice') {
    return (
      <div className="bg-white rounded-xl shadow-sm mb-3 p-4 animate-scale-in">
        <VoiceRecorder
          onDone={() => { setMode('text'); setExpanded(false); onPosted() }}
          onCancel={() => { setMode('text'); setExpanded(false) }}
          onRecorded={async (url, dur) => { await createMediaPost('audio', url, dur) }}
        />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm mb-3">
      {/* Ligne principale : avatar + champ */}
      <div className="flex items-center gap-3 px-4 py-3">
        <AvatarCircle
          email={userEmail}
          nom={userProfile?.nom}
          avatarUrl={userProfile?.avatar_url}
          couleur={userProfile?.couleur}
          size="md"
        />

        {!expanded ? (
          /* Placeholder cliquable */
          <button
            onClick={() => setExpanded(true)}
            className="flex-1 text-left px-4 py-2.5 bg-sand rounded-full text-ink-soft text-[15px] hover:bg-sand-warm transition-colors min-h-[44px] cursor-text"
          >
            {prenom}, tu penses à quoi ?
          </button>
        ) : (
          /* Textarea déployée */
          <textarea
            value={text}
            onChange={e => { setText(e.target.value); setError(null) }}
            placeholder="Dis quelque chose à la famille ♡"
            rows={3}
            autoFocus
            aria-label="Dis quelque chose à la famille"
            className="flex-1 px-4 py-2.5 bg-sand rounded-2xl text-ink text-[15px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-terracotta/40 resize-none"
          />
        )}
      </div>

      {error && (
        <p className="text-sm text-red-500 px-4 pb-2" role="alert">{error}</p>
      )}

      {/* Séparateur */}
      <div className="mx-4 border-t border-sand" />

      {/* Boutons d'action */}
      <div className="flex items-center px-2 py-1 gap-1">
        {/* Photo */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploadingPhoto || isPending}
          aria-label="Ajouter une photo"
          className="flex flex-1 items-center justify-center gap-2 py-2 rounded-lg hover:bg-sand active:bg-sand-warm transition-colors text-ink-soft hover:text-olive min-h-[44px] text-sm font-medium disabled:opacity-40"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          {isUploadingPhoto ? 'Envoi…' : 'Photo'}
        </button>

        {/* Vocal */}
        <button
          onClick={() => { setMode('voice'); setExpanded(true) }}
          disabled={isPending || isUploadingPhoto}
          aria-label="Enregistrement vocal"
          className="flex flex-1 items-center justify-center gap-2 py-2 rounded-lg hover:bg-sand active:bg-sand-warm transition-colors text-ink-soft hover:text-azur min-h-[44px] text-sm font-medium disabled:opacity-40"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
            <line x1="8" y1="23" x2="16" y2="23"/>
          </svg>
          Vocal
        </button>

        {/* Partager — visible seulement quand du texte est saisi */}
        {expanded && text.trim() && (
          <button
            onClick={handleSubmitText}
            disabled={isPending}
            className="flex flex-1 items-center justify-center py-2 rounded-lg bg-terracotta hover:bg-terracotta-deep active:scale-95 text-white min-h-[44px] text-sm font-semibold disabled:opacity-50 transition-all"
          >
            {isPending ? 'Envoi…' : 'Partager'}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelected}
        className="hidden"
        aria-hidden="true"
      />
    </div>
  )
}
