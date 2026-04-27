'use client'

import { useState, useTransition } from 'react'
import { createCompteARebours, deleteCompteARebours } from '@/app/actions/agenda'
import type { CompteARebours } from '@/types/agenda'

const ANNIVERSAIRES = [
  { nom: 'Sandra', mois: 11, jour: 14, anneeNaissance: 2013, emoji: '🎂' },
  { nom: 'Sarah',  mois: 12, jour: 14, anneeNaissance: 2017, emoji: '🎂' },
]

function joursRestants(isoDate: string): number {
  const target = new Date(isoDate)
  target.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000)
}

function prochainAnniversaire(mois: number, jour: number, anneeNaissance: number) {
  const today = new Date()
  const thisYear = today.getFullYear()
  let next = new Date(thisYear, mois - 1, jour)
  next.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  if (next < today) next = new Date(thisYear + 1, mois - 1, jour)
  const age = next.getFullYear() - anneeNaissance
  const jours = Math.ceil((next.getTime() - today.getTime()) / 86_400_000)
  const dateStr = next.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
  return { age, jours, dateStr }
}

interface CompteAReboursSectionProps {
  comptes: CompteARebours[]
  currentUserId: string
  onChanged: () => void
}

export default function CompteAReboursSection({ comptes, currentUserId, onChanged }: CompteAReboursSectionProps) {
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle]       = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [emoji, setEmoji]       = useState('⏳')
  const [isPending, startTransition] = useTransition()

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !targetDate) return
    startTransition(async () => {
      await createCompteARebours(title, targetDate, emoji)
      setTitle(''); setTargetDate(''); setEmoji('⏳'); setShowForm(false)
      onChanged()
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Supprimer ce compte à rebours ?')) return
    startTransition(async () => {
      await deleteCompteARebours(id)
      onChanged()
    })
  }

  return (
    <section>
      <h2 className="font-manrope font-semibold text-ink mb-4">Comptes à rebours</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ANNIVERSAIRES.map((anniv) => {
          const { age, jours, dateStr } = prochainAnniversaire(anniv.mois, anniv.jour, anniv.anneeNaissance)
          return (
            <div key={anniv.nom} className="bg-jasmine rounded-2xl p-4 border border-gold/30">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{anniv.emoji}</span>
                <p className="font-manrope font-semibold text-ink">{anniv.nom} aura {age} ans !</p>
              </div>
              <p className="font-manrope text-xs text-ink-soft mb-2">{dateStr}</p>
              <p className="font-fraunces text-3xl font-bold text-gold tabular-nums">
                {jours === 0 ? "Aujourd'hui ! 🎉" : jours > 0 ? `${jours} jours` : 'Passé'}
              </p>
            </div>
          )
        })}

        {comptes.map((compte) => {
          const jours = joursRestants(compte.target_date)
          const isOwn = compte.author_id === currentUserId
          return (
            <div key={compte.id} className="bg-cream rounded-2xl p-4 border border-sand-warm relative group">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{compte.emoji}</span>
                <p className="font-manrope font-semibold text-ink">{compte.title}</p>
              </div>
              <p className="font-fraunces text-3xl font-bold text-terracotta tabular-nums">
                {jours === 0 ? "Aujourd'hui ! 🎉" : jours > 0 ? `${jours} jours` : 'Passé'}
              </p>
              {isOwn && (
                <button
                  onClick={() => handleDelete(compte.id)}
                  disabled={isPending}
                  aria-label="Supprimer ce compte à rebours"
                  className="absolute top-3 right-3 w-6 h-6 rounded-full bg-sand flex items-center justify-center text-ink-soft opacity-0 group-hover:opacity-100 transition-opacity hover:text-terracotta"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                    <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              )}
            </div>
          )
        })}

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-2xl p-4 border-2 border-dashed border-sand-warm text-ink-soft hover:border-terracotta hover:text-terracotta transition-colors font-manrope text-sm flex items-center justify-center gap-2"
          >
            <span className="text-lg">+</span> Ajouter un compte à rebours
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="mt-4 bg-cream rounded-2xl p-4 border border-sand-warm space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              className="w-12 text-center rounded-lg border border-sand-warm p-2 font-manrope text-lg focus:outline-none focus:ring-2 focus:ring-terracotta/40"
              maxLength={2}
              aria-label="Emoji"
            />
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre du compte à rebours"
              className="flex-1 rounded-lg border border-sand-warm p-2 font-manrope text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/40"
              required
            />
          </div>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full rounded-lg border border-sand-warm p-2 font-manrope text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/40"
            required
          />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="font-manrope text-sm text-ink-soft hover:text-ink px-3 py-1.5">
              Annuler
            </button>
            <button type="submit" disabled={isPending} className="font-manrope text-sm font-semibold bg-terracotta text-white rounded-lg px-4 py-1.5 hover:bg-terracotta-deep disabled:opacity-50">
              {isPending ? 'Ajout…' : 'Ajouter'}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
