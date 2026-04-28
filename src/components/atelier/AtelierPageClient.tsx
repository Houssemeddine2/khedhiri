'use client'

import { useState } from 'react'
import DrawingCanvas from './DrawingCanvas'
import CoinSouvenir from './CoinSouvenir'

type Onglet = 'atelier' | 'souvenir'

interface AtelierPageClientProps {
  userId: string
}

export default function AtelierPageClient({ userId }: AtelierPageClientProps) {
  const [onglet, setOnglet] = useState<Onglet>('atelier')

  function handleSaved() {
    // Après sauvegarde d'un dessin numérique, basculer vers le Coin souvenir
    setOnglet('souvenir')
  }

  function handlePublished() {
    // No-op ici — le rafraîchissement de la timeline se fait via router.refresh() dans la page parente
    // ou via un message de succès dans CoinSouvenir
  }

  return (
    <div>
      {/* Onglets */}
      <div className="flex gap-0 mb-6 border-b-2 border-sand-warm">
        <button
          onClick={() => setOnglet('atelier')}
          aria-selected={onglet === 'atelier'}
          role="tab"
          className={`px-5 py-2.5 font-manrope text-sm font-semibold rounded-t-lg transition-colors ${
            onglet === 'atelier'
              ? 'bg-terracotta text-white border-b-2 border-terracotta -mb-0.5'
              : 'text-ink-soft hover:text-ink'
          }`}
        >
          Mon atelier 🎨
        </button>
        <button
          onClick={() => setOnglet('souvenir')}
          aria-selected={onglet === 'souvenir'}
          role="tab"
          className={`px-5 py-2.5 font-manrope text-sm font-semibold rounded-t-lg transition-colors ${
            onglet === 'souvenir'
              ? 'bg-terracotta text-white border-b-2 border-terracotta -mb-0.5'
              : 'text-ink-soft hover:text-ink'
          }`}
        >
          Coin souvenir ✏️
        </button>
      </div>

      {/* Contenu */}
      {onglet === 'atelier' && (
        <DrawingCanvas onSaved={handleSaved} />
      )}
      {onglet === 'souvenir' && (
        <CoinSouvenir userId={userId} onPublished={handlePublished} />
      )}
    </div>
  )
}
