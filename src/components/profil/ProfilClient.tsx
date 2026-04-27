'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfil } from '@/app/actions/profil'
import { uploadMedia } from '@/app/actions/posts'
import AvatarCircle from '@/components/ui/AvatarCircle'

const COULEURS = [
  { key: 'terracotta', label: 'Terracotta', bg: 'bg-terracotta' },
  { key: 'olive',      label: 'Olive',      bg: 'bg-olive' },
  { key: 'azur',       label: 'Azur',       bg: 'bg-azur' },
  { key: 'gold',       label: 'Or',         bg: 'bg-gold' },
  { key: 'rose',       label: 'Rose',       bg: 'bg-rose' },
]

interface ProfilClientProps {
  userId: string
  email: string
  nom: string
  bio: string | null
  couleur: string | null
  avatarUrl: string | null
}

export default function ProfilClient({ userId, email, nom, bio, couleur, avatarUrl }: ProfilClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [localCouleur, setLocalCouleur] = useState(couleur ?? 'terracotta')
  const [localBio, setLocalBio] = useState(bio ?? '')
  const [localAvatarUrl, setLocalAvatarUrl] = useState(avatarUrl)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [saved, setSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPhoto(true)
    const fd = new FormData()
    fd.append('file', file)
    const url = await uploadMedia(fd)
    setLocalAvatarUrl(url)
    setUploadingPhoto(false)
  }

  function handleSave() {
    startTransition(async () => {
      await updateProfil({ bio: localBio, couleur: localCouleur, avatar_url: localAvatarUrl ?? undefined })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <AvatarCircle
            email={email}
            nom={nom}
            avatarUrl={localAvatarUrl}
            couleur={localCouleur}
            size="2xl"
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploadingPhoto}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-terracotta text-white flex items-center justify-center shadow-md hover:bg-terracotta-deep transition-colors disabled:opacity-50"
            aria-label="Changer la photo"
          >
            {uploadingPhoto ? (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            )}
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
        <p className="font-fraunces text-xl font-bold text-ink">{nom}</p>
        <p className="font-manrope text-sm text-ink-soft">{email}</p>
      </div>

      {/* Couleur */}
      <div>
        <p className="font-manrope text-sm font-semibold text-ink mb-2">Ma couleur</p>
        <div className="flex gap-3">
          {COULEURS.map(c => (
            <button
              key={c.key}
              onClick={() => setLocalCouleur(c.key)}
              aria-label={c.label}
              className={`w-9 h-9 rounded-full ${c.bg} transition-transform ${localCouleur === c.key ? 'ring-2 ring-offset-2 ring-ink scale-110' : 'hover:scale-105'}`}
            />
          ))}
        </div>
      </div>

      {/* Bio */}
      <div>
        <label htmlFor="bio" className="font-manrope text-sm font-semibold text-ink block mb-2">
          Ma petite présentation
        </label>
        <textarea
          id="bio"
          value={localBio}
          onChange={e => setLocalBio(e.target.value)}
          placeholder="Dis quelque chose sur toi…"
          maxLength={200}
          rows={3}
          className="w-full rounded-xl border border-sand-warm bg-jasmine px-3 py-2 font-manrope text-sm text-ink placeholder:text-ink-soft/60 focus:outline-none focus:ring-2 focus:ring-terracotta resize-none"
        />
        <p className="text-xs text-ink-soft text-right mt-1">{localBio.length}/200</p>
      </div>

      {/* Bouton sauvegarder */}
      <button
        onClick={handleSave}
        disabled={isPending}
        className="w-full bg-terracotta text-white font-manrope font-semibold py-3 rounded-xl hover:bg-terracotta-deep transition-colors disabled:opacity-50"
      >
        {isPending ? 'Enregistrement…' : saved ? '✓ Enregistré !' : 'Enregistrer'}
      </button>
    </div>
  )
}
