'use client'

import { useState } from 'react'
import type { MembreFamille, Anecdote } from '@/types/famille'
import MembreCard from './MembreCard'
import MembreDetail from './MembreDetail'
import AjouterMembre from './AjouterMembre'

type Cote = 'khedhiri' | 'maternel'

interface ArbreGenealogiqueProps {
  membres: MembreFamille[]
  anecdotes: Anecdote[]
  currentUserId: string
  isPapa: boolean
}

const LABELS_GENERATION: Record<number, string> = {
  0: 'Arrière-grands-parents',
  1: 'Grands-parents',
  2: 'Parents · Oncles · Tantes',
  3: 'Notre génération',
  4: 'Cousins · Cousines',
}

export default function ArbreGenealogique({ membres, anecdotes, currentUserId, isPapa }: ArbreGenealogiqueProps) {
  const [cote, setCote] = useState<Cote>('khedhiri')
  const [selected, setSelected] = useState<MembreFamille | null>(null)
  const [ajouterVisible, setAjouterVisible] = useState(false)

  const membresFiltres = membres.filter(m => m.cote === cote)

  const parGeneration: Record<number, MembreFamille[]> = {}
  for (const m of membresFiltres) {
    if (!parGeneration[m.generation]) parGeneration[m.generation] = []
    parGeneration[m.generation].push(m)
  }
  const generations = Object.keys(parGeneration).map(Number).sort()

  const anecdotesDuMembre = selected
    ? anecdotes.filter(a => a.membre_id === selected.id)
    : []

  return (
    <>
      {/* Onglets côtés */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setCote('khedhiri')}
          className={`flex-1 py-2 rounded-xl font-manrope text-sm font-semibold transition-colors ${
            cote === 'khedhiri' ? 'bg-terracotta text-white' : 'bg-sand text-ink-soft hover:bg-sand-warm'
          }`}
        >
          🇹🇳 Côté Khedhiri
        </button>
        <button
          onClick={() => setCote('maternel')}
          className={`flex-1 py-2 rounded-xl font-manrope text-sm font-semibold transition-colors ${
            cote === 'maternel' ? 'bg-azur text-white' : 'bg-sand text-ink-soft hover:bg-sand-warm'
          }`}
        >
          🌿 Côté Maternel
        </button>
      </div>

      {/* Bouton ajouter */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setAjouterVisible(true)}
          className="bg-terracotta text-white px-4 py-1.5 rounded-xl font-manrope text-sm font-semibold hover:bg-terracotta-deep transition-colors"
        >
          + Ajouter un membre
        </button>
      </div>

      {/* Grille par génération */}
      {generations.length === 0 ? (
        <p className="font-manrope text-ink-soft text-center py-16">
          Aucun membre ajouté pour ce côté. Commencez par ajouter les grands-parents !
        </p>
      ) : (
        <div className="space-y-8">
          {generations.map(gen => (
            <div key={gen}>
              <h3 className="font-fraunces text-base font-bold text-ink-soft mb-3 border-b border-sand-warm pb-1">
                {LABELS_GENERATION[gen] ?? `Génération ${gen}`}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {parGeneration[gen].map(m => (
                  <MembreCard key={m.id} membre={m} onClick={() => setSelected(m)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {selected && (
        <MembreDetail
          membre={selected}
          anecdotes={anecdotesDuMembre}
          currentUserId={currentUserId}
          isPapa={isPapa}
          onClose={() => setSelected(null)}
        />
      )}
      {ajouterVisible && (
        <AjouterMembre onClose={() => setAjouterVisible(false)} />
      )}
    </>
  )
}
