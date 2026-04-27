'use client'

import { useState, useTransition } from 'react'
import { createEvenement, deleteEvenement } from '@/app/actions/agenda'
import { avatarFromEmail } from '@/lib/avatar'
import { MEMBRES } from '@/lib/membres'
import type { Evenement } from '@/types/agenda'

const JOURS = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di']
const MOIS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

const COULEURS: Record<string, { dot: string; bg: string; text: string; border: string }> = {
  terracotta: { dot: 'bg-terracotta', bg: 'bg-terracotta/10', text: 'text-terracotta', border: 'border-terracotta/30' },
  olive:      { dot: 'bg-olive',      bg: 'bg-olive/10',      text: 'text-olive',      border: 'border-olive/30'      },
  azur:       { dot: 'bg-azur',       bg: 'bg-azur/10',       text: 'text-azur',       border: 'border-azur/30'       },
  gold:       { dot: 'bg-gold',       bg: 'bg-gold/10',       text: 'text-gold',       border: 'border-gold/30'       },
}

interface CalendrierMensuelProps {
  evenements: Evenement[]
  currentUserId: string
  onChanged: () => void
}

export default function CalendrierMensuel({ evenements, currentUserId, onChanged }: CalendrierMensuelProps) {
  const today = new Date()
  const [year, setYear]   = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle]  = useState('')
  const [date, setDate]    = useState('')
  const [color, setColor]  = useState('terracotta')
  const [isPending, startTransition] = useTransition()

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startDow = (firstDay.getDay() + 6) % 7

  const cells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`
  const eventsThisMonth = evenements
    .filter(e => e.date.startsWith(monthStr))
    .sort((a, b) => a.date.localeCompare(b.date))

  const eventsByDay: Record<number, Evenement[]> = {}
  for (const ev of eventsThisMonth) {
    const day = parseInt(ev.date.split('-')[2], 10)
    if (!eventsByDay[day]) eventsByDay[day] = []
    eventsByDay[day].push(ev)
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !date) return
    startTransition(async () => {
      await createEvenement(title, date, color)
      setTitle(''); setDate(''); setShowForm(false)
      onChanged()
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Supprimer cet événement ?')) return
    startTransition(async () => {
      await deleteEvenement(id)
      onChanged()
    })
  }

  const todayDay = today.getFullYear() === year && today.getMonth() === month ? today.getDate() : -1

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-manrope font-semibold text-ink">Calendrier</h2>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} aria-label="Mois précédent" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-sand transition-colors text-ink-soft">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M10 3L5 8l5 5"/>
            </svg>
          </button>
          <span className="font-manrope font-semibold text-ink min-w-[140px] text-center text-sm">
            {MOIS_FR[month]} {year}
          </span>
          <button onClick={nextMonth} aria-label="Mois suivant" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-sand transition-colors text-ink-soft">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 3l5 5-5 5"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Grille calendrier */}
      <div className="bg-cream rounded-2xl border border-sand-warm overflow-hidden">
        <div className="grid grid-cols-7 bg-sand">
          {JOURS.map(j => (
            <div key={j} className="text-center py-2 font-manrope text-xs font-semibold text-ink-soft">{j}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            const events = day ? (eventsByDay[day] ?? []) : []
            const isToday = day === todayDay
            return (
              <div key={idx} className={`min-h-[52px] p-1 border-t border-sand-warm/50 ${!day ? 'bg-sand/20' : ''}`}>
                {day && (
                  <>
                    <span className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-manrope font-medium ${
                      isToday ? 'bg-terracotta text-white' : 'text-ink-soft'
                    }`}>
                      {day}
                    </span>
                    <div className="flex flex-wrap gap-0.5 mt-0.5">
                      {events.slice(0, 3).map(ev => (
                        <span key={ev.id} className={`w-1.5 h-1.5 rounded-full ${COULEURS[ev.color]?.dot ?? 'bg-terracotta'}`} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Liste des événements du mois */}
      <div className="mt-4 space-y-2">
        {eventsThisMonth.length === 0 ? (
          <p className="font-manrope text-ink-soft text-sm text-center py-2">Aucun événement ce mois-ci</p>
        ) : (
          eventsThisMonth.map((ev) => {
            const c = COULEURS[ev.color] ?? COULEURS.terracotta
            const auteur = MEMBRES.find(m => m.id === ev.author_id)
            const avatar = auteur ? avatarFromEmail(auteur.email) : null
            const dateLabel = new Date(ev.date + 'T12:00:00').toLocaleDateString('fr-FR', {
              weekday: 'long', day: 'numeric', month: 'long',
            })
            const isOwn = ev.author_id === currentUserId
            return (
              <div key={ev.id} className={`flex items-center gap-3 rounded-xl p-3 border ${c.bg} ${c.border} group`}>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-manrope font-semibold text-ink text-sm truncate">{ev.title}</p>
                  <p className="font-manrope text-xs text-ink-soft capitalize">{dateLabel}</p>
                </div>
                {avatar && (
                  <span className={`w-6 h-6 rounded-full ${avatar.couleurBg} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                    {avatar.initiale}
                  </span>
                )}
                {isOwn && (
                  <button
                    onClick={() => handleDelete(ev.id)}
                    disabled={isPending}
                    aria-label="Supprimer cet événement"
                    className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-ink-soft opacity-0 group-hover:opacity-100 transition-opacity hover:text-terracotta"
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                      <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Formulaire / bouton ajouter */}
      {showForm ? (
        <form onSubmit={handleAdd} className="mt-4 bg-cream rounded-2xl p-4 border border-sand-warm space-y-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre de l'événement"
            className="w-full rounded-lg border border-sand-warm p-2 font-manrope text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/40"
            required
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-sand-warm p-2 font-manrope text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/40"
            required
          />
          <div className="flex items-center gap-2">
            <span className="font-manrope text-xs text-ink-soft">Couleur :</span>
            {Object.entries(COULEURS).map(([key, c]) => (
              <button
                key={key}
                type="button"
                onClick={() => setColor(key)}
                aria-label={key}
                className={`w-7 h-7 rounded-full border-2 transition-transform active:scale-95 ${c.dot} ${color === key ? 'border-ink scale-110' : 'border-transparent'}`}
              />
            ))}
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="font-manrope text-sm text-ink-soft hover:text-ink px-3 py-1.5">
              Annuler
            </button>
            <button type="submit" disabled={isPending} className="font-manrope text-sm font-semibold bg-terracotta text-white rounded-lg px-4 py-1.5 hover:bg-terracotta-deep disabled:opacity-50">
              {isPending ? 'Ajout…' : 'Ajouter'}
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="mt-4 w-full rounded-xl p-3 border-2 border-dashed border-sand-warm text-ink-soft hover:border-terracotta hover:text-terracotta transition-colors font-manrope text-sm"
        >
          + Ajouter un événement
        </button>
      )}
    </section>
  )
}
