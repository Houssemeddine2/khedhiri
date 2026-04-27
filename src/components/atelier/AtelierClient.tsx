'use client'

import { useRouter } from 'next/navigation'
import DrawingCanvas from './DrawingCanvas'
import CreationCard from './CreationCard'
import type { Creation } from '@/types/creation'

interface AtelierClientProps {
  initialCreations: Creation[]
  currentUserId: string
}

export default function AtelierClient({ initialCreations, currentUserId }: AtelierClientProps) {
  const router = useRouter()

  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-manrope font-semibold text-ink mb-3">Mon dessin</h2>
        <DrawingCanvas onSaved={() => router.refresh()} />
      </section>

      <section>
        <h2 className="font-manrope font-semibold text-ink mb-3">
          Nos créations ({initialCreations.length})
        </h2>
        {initialCreations.length === 0 ? (
          <p className="font-manrope text-ink-soft text-center py-8">
            Pas encore de création ! Dessine quelque chose 😊
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {initialCreations.map((creation) => (
              <CreationCard
                key={creation.id}
                creation={creation}
                currentUserId={currentUserId}
                onDeleted={() => router.refresh()}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
