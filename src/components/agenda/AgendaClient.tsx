'use client'

import { useRouter } from 'next/navigation'
import CompteAReboursSection from './CompteAReboursSection'
import CalendrierMensuel from './CalendrierMensuel'
import CarteInteractive from './CarteInteractive'
import type { Evenement, CompteARebours } from '@/types/agenda'

interface AgendaClientProps {
  initialEvenements: Evenement[]
  initialComptes: CompteARebours[]
  currentUserId: string
}

export default function AgendaClient({ initialEvenements, initialComptes, currentUserId }: AgendaClientProps) {
  const router = useRouter()
  const refresh = () => router.refresh()

  return (
    <div className="space-y-10">
      <CompteAReboursSection
        comptes={initialComptes}
        currentUserId={currentUserId}
        onChanged={refresh}
      />
      <CalendrierMensuel
        evenements={initialEvenements}
        currentUserId={currentUserId}
        onChanged={refresh}
      />
      <CarteInteractive />
    </div>
  )
}
