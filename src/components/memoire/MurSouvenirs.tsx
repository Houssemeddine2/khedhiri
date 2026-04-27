'use client'

import { useState } from 'react'
import type { Souvenir } from '@/types/memoire'
import type { Creation } from '@/types/creation'
import PolaroidCard from './PolaroidCard'
import SouvenirDetail from './SouvenirDetail'
import AjouterSouvenir from './AjouterSouvenir'

type Filtre = 'tous' | 'photo' | 'audio' | 'dessin' | 'texte'

interface MurSouvenirsProps {
  souvenirs: Souvenir[]
  creations: Creation[]
  currentUserId: string
  isPapa: boolean
}

export default function MurSouvenirs({ souvenirs, creations, currentUserId, isPapa }: MurSouvenirsProps) {
  const [filtre, setFiltre] = useState<Filtre>('tous')
  const [selected, setSelected] = useState<Souvenir | null>(null)
  const [ajouterVisible, setAjouterVisible] = useState(false)

  const filtres: { key: Filtre; label: string }[] = [
    { key: 'tous', label: 'Tous' },
    { key: 'photo', label: '📸 Photos' },
    { key: 'audio', label: '🎵 Vocaux' },
    { key: 'dessin', label: '🎨 Dessins' },
    { key: 'texte', label: '✍️ Textes' },
  ]

  const souvenirsFiltres = souvenirs.filter(s => {
    if (filtre === 'tous') return true
    if (filtre === 'photo') return !!s.photo_url
    if (filtre === 'audio') return !!s.audio_url
    if (filtre === 'dessin') return !!s.creation_id
    if (filtre === 'texte') return !s.photo_url && !s.audio_url && !s.creation_id
    return true
  })

  return (
    <>
      {/* Barre d'actions */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex gap-2 flex-wrap">
          {filtres.map(f => (
            <button
              key={f.key}
              onClick={() => setFiltre(f.key)}
              className={`px-3 py-1 rounded-full font-manrope text-xs font-semibold transition-colors ${
                filtre === f.key
                  ? 'bg-terracotta text-white'
                  : 'bg-sand text-ink-soft hover:bg-sand-warm'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setAjouterVisible(true)}
          className="bg-terracotta text-white px-4 py-1.5 rounded-xl font-manrope text-sm font-semibold hover:bg-terracotta-deep transition-colors"
        >
          + Ajouter
        </button>
      </div>

      {/* Mur de polaroïds */}
      {souvenirsFiltres.length === 0 ? (
        <p className="font-manrope text-ink-soft text-center py-16">
          Aucun souvenir pour l'instant. Ajoutez le premier ! ✨
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
          {souvenirsFiltres.map(s => (
            <PolaroidCard key={s.id} souvenir={s} onClick={() => setSelected(s)} />
          ))}
        </div>
      )}

      {/* Modals */}
      {selected && (
        <SouvenirDetail
          souvenir={selected}
          currentUserId={currentUserId}
          isPapa={isPapa}
          onClose={() => setSelected(null)}
        />
      )}
      {ajouterVisible && (
        <AjouterSouvenir
          creations={creations}
          onClose={() => setAjouterVisible(false)}
        />
      )}
    </>
  )
}
