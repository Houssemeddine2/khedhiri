# Étape 7 — Agenda + Compte à rebours + Carte interactive

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Page `/agenda` avec un calendrier mensuel pour les événements familiaux, des comptes à rebours (anniversaires + événements personnalisés), et une carte visuelle Lisbonne ↔ Tunis avec les heures locales en direct.

**Architecture:** Table `evenements` (calendrier) + table `comptes_a_rebours` (countdowns custom) dans Supabase. Les anniversaires de Sandra et Sarah sont calculés côté client (hardcodés). La carte est un visuel stylisé avec `setInterval` pour les heures en direct. La page est Server Component pour le SSR ; les parties interactives sont des Client Components.

**Tech Stack:** Next.js 15, Supabase, `Intl.DateTimeFormat` (fuseaux horaires), HTML/CSS pur pour la carte.

---

## Fichiers

| Action | Fichier | Responsabilité |
|--------|---------|----------------|
| Créer | `supabase/etape7-schema.sql` | Tables evenements + comptes_a_rebours |
| Créer | `src/types/agenda.ts` | Types Evenement, CompteARebours |
| Créer | `src/app/actions/agenda.ts` | CRUD evenements + comptes |
| Créer | `src/app/agenda/page.tsx` | Page serveur |
| Créer | `src/components/agenda/AgendaClient.tsx` | Wrapper client |
| Créer | `src/components/agenda/CalendrierMensuel.tsx` | Calendrier + liste + formulaire |
| Créer | `src/components/agenda/CompteAReboursSection.tsx` | Anniversaires + countdowns custom |
| Créer | `src/components/agenda/CarteInteractive.tsx` | Carte Lisbonne ↔ Tunis + heures live |
| Modifier | `src/components/NavBar.tsx` | Lien Agenda |

---

### Task 1 : SQL schema

**Files:**
- Create: `supabase/etape7-schema.sql`

- [ ] **Step 1 : Créer le fichier**

```sql
-- supabase/etape7-schema.sql
CREATE TABLE IF NOT EXISTS evenements (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  date        DATE        NOT NULL,
  description TEXT,
  color       TEXT        NOT NULL DEFAULT 'terracotta',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX evenements_date_idx ON evenements (date);
ALTER TABLE evenements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "famille peut voir les events"   ON evenements FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auteur peut créer un event"     ON evenements FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "auteur peut supprimer son event" ON evenements FOR DELETE USING (auth.uid() = author_id);
ALTER PUBLICATION supabase_realtime ADD TABLE evenements;

CREATE TABLE IF NOT EXISTS comptes_a_rebours (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  target_date DATE        NOT NULL,
  emoji       TEXT        NOT NULL DEFAULT '⏳',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE comptes_a_rebours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "famille peut voir les comptes"   ON comptes_a_rebours FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auteur peut créer un compte"     ON comptes_a_rebours FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "auteur peut supprimer son compte" ON comptes_a_rebours FOR DELETE USING (auth.uid() = author_id);
```

- [ ] **Step 2 : Exécuter dans Supabase**

Dashboard Supabase → SQL Editor → coller → Run.

---

### Task 2 : Types + server actions

**Files:**
- Create: `src/types/agenda.ts`
- Create: `src/app/actions/agenda.ts`

- [ ] **Step 1 : Types**

```typescript
// src/types/agenda.ts
export type Evenement = {
  id: string
  author_id: string
  title: string
  date: string        // YYYY-MM-DD
  description: string | null
  color: string
  created_at: string
}

export type CompteARebours = {
  id: string
  author_id: string
  title: string
  target_date: string // YYYY-MM-DD
  emoji: string
  created_at: string
}
```

- [ ] **Step 2 : Server actions**

```typescript
// src/app/actions/agenda.ts
'use server'

import { createClient } from '@/lib/supabase/server'

export async function createEvenement(
  title: string,
  date: string,
  color: string,
  description?: string,
): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { error } = await supabase.from('evenements').insert({
    author_id:   user.id,
    title:       title.trim(),
    date,
    color,
    description: description?.trim() || null,
  })
  if (error) throw new Error(error.message)
}

export async function deleteEvenement(id: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { error } = await supabase
    .from('evenements').delete().eq('id', id).eq('author_id', user.id)
  if (error) throw new Error(error.message)
}

export async function createCompteARebours(
  title: string,
  targetDate: string,
  emoji: string,
): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { error } = await supabase.from('comptes_a_rebours').insert({
    author_id:   user.id,
    title:       title.trim(),
    target_date: targetDate,
    emoji,
  })
  if (error) throw new Error(error.message)
}

export async function deleteCompteARebours(id: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { error } = await supabase
    .from('comptes_a_rebours').delete().eq('id', id).eq('author_id', user.id)
  if (error) throw new Error(error.message)
}
```

---

### Task 3 : Page agenda + AgendaClient

**Files:**
- Create: `src/app/agenda/page.tsx`
- Create: `src/components/agenda/AgendaClient.tsx`

- [ ] **Step 1 : Page serveur**

```typescript
// src/app/agenda/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NavBar from '@/components/NavBar'
import AgendaClient from '@/components/agenda/AgendaClient'
import type { Evenement, CompteARebours } from '@/types/agenda'

export default async function AgendaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: evenements }, { data: comptes }] = await Promise.all([
    supabase.from('evenements').select('*').order('date', { ascending: true }),
    supabase.from('comptes_a_rebours').select('*').order('target_date', { ascending: true }),
  ])

  return (
    <>
      <NavBar />
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        <h1 className="font-fraunces text-2xl font-bold text-ink">
          Agenda & Compte à rebours 📅
        </h1>
        <AgendaClient
          initialEvenements={(evenements ?? []) as Evenement[]}
          initialComptes={(comptes ?? []) as CompteARebours[]}
          currentUserId={user.id}
        />
      </main>
    </>
  )
}
```

- [ ] **Step 2 : AgendaClient**

```typescript
// src/components/agenda/AgendaClient.tsx
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
```

---

### Task 4 : CompteAReboursSection

**Files:**
- Create: `src/components/agenda/CompteAReboursSection.tsx`

- [ ] **Step 1 : Créer le composant**

```typescript
// src/components/agenda/CompteAReboursSection.tsx
'use client'

import { useState, useTransition } from 'react'
import { createCompteARebours, deleteCompteARebours } from '@/app/actions/agenda'
import type { CompteARebours } from '@/types/agenda'

// Anniversaires hardcodés (CLAUDE.md)
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
  if (next <= today) next = new Date(thisYear + 1, mois - 1, jour)
  const age = next.getFullYear() - anneeNaissance
  const jours = joursRestants(next.toISOString().split('T')[0])
  return { age, jours, dateStr: next.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) }
}

interface CompteAReboursSectionProps {
  comptes: CompteARebours[]
  currentUserId: string
  onChanged: () => void
}

export default function CompteAReboursSection({ comptes, currentUserId, onChanged }: CompteAReboursSectionProps) {
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [emoji, setEmoji] = useState('⏳')
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
        {/* Anniversaires hardcodés */}
        {ANNIVERSAIRES.map((anniv) => {
          const { age, jours, dateStr } = prochainAnniversaire(anniv.mois, anniv.jour, anniv.anneeNaissance)
          return (
            <div key={anniv.nom} className="bg-jasmine rounded-2xl p-4 border border-gold/30">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{anniv.emoji}</span>
                <p className="font-manrope font-semibold text-ink">{anniv.nom} a {age} ans !</p>
              </div>
              <p className="font-manrope text-xs text-ink-soft mb-2">{dateStr}</p>
              <p className="font-fraunces text-3xl font-bold text-gold tabular-nums">
                {jours === 0 ? "Aujourd'hui ! 🎉" : jours > 0 ? `${jours} jours` : 'Passé'}
              </p>
            </div>
          )
        })}

        {/* Comptes custom */}
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

        {/* Bouton ajouter */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-2xl p-4 border-2 border-dashed border-sand-warm text-ink-soft hover:border-terracotta hover:text-terracotta transition-colors font-manrope text-sm flex items-center justify-center gap-2"
          >
            <span className="text-lg">+</span> Ajouter un compte à rebours
          </button>
        )}
      </div>

      {/* Formulaire d'ajout */}
      {showForm && (
        <form onSubmit={handleAdd} className="mt-4 bg-cream rounded-2xl p-4 border border-sand-warm space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              className="w-12 text-center rounded-lg border border-sand-warm p-2 font-manrope text-lg"
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
            <button type="button" onClick={() => setShowForm(false)} className="font-manrope text-sm text-ink-soft hover:text-ink px-3 py-1.5">Annuler</button>
            <button type="submit" disabled={isPending} className="font-manrope text-sm font-semibold bg-terracotta text-white rounded-lg px-4 py-1.5 hover:bg-terracotta-deep disabled:opacity-50">
              {isPending ? 'Ajout…' : 'Ajouter'}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
```

---

### Task 5 : CalendrierMensuel

**Files:**
- Create: `src/components/agenda/CalendrierMensuel.tsx`

- [ ] **Step 1 : Créer le composant**

```typescript
// src/components/agenda/CalendrierMensuel.tsx
'use client'

import { useState, useTransition } from 'react'
import { createEvenement, deleteEvenement } from '@/app/actions/agenda'
import { avatarFromEmail } from '@/lib/avatar'
import { MEMBRES } from '@/lib/membres'
import type { Evenement } from '@/types/agenda'

const JOURS = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di']
const MOIS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

const COULEURS: Record<string, { dot: string; bg: string; text: string; border: string }> = {
  terracotta: { dot: 'bg-terracotta',    bg: 'bg-terracotta/10',  text: 'text-terracotta',    border: 'border-terracotta/30'  },
  olive:      { dot: 'bg-olive',         bg: 'bg-olive/10',       text: 'text-olive',         border: 'border-olive/30'       },
  azur:       { dot: 'bg-azur',          bg: 'bg-azur/10',        text: 'text-azur',          border: 'border-azur/30'        },
  gold:       { dot: 'bg-gold',          bg: 'bg-gold/10',        text: 'text-gold',          border: 'border-gold/30'        },
}

interface CalendrierMensuelProps {
  evenements: Evenement[]
  currentUserId: string
  onChanged: () => void
}

export default function CalendrierMensuel({ evenements, currentUserId, onChanged }: CalendrierMensuelProps) {
  const today = new Date()
  const [year, setYear]   = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth()) // 0-indexed
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle]       = useState('')
  const [date, setDate]         = useState('')
  const [color, setColor]       = useState('terracotta')
  const [isPending, startTransition] = useTransition()

  // Navigation
  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  // Génération de la grille
  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startDow = (firstDay.getDay() + 6) % 7 // lundi = 0

  const cells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null)

  // Events du mois courant
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`
  const eventsThisMonth = evenements.filter(e => e.date.startsWith(monthStr))
    .sort((a, b) => a.date.localeCompare(b.date))

  // Map jour → events
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
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} aria-label="Mois précédent" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-sand transition-colors text-ink-soft">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M10 3L5 8l5 5"/></svg>
          </button>
          <span className="font-manrope font-semibold text-ink min-w-[140px] text-center">
            {MOIS_FR[month]} {year}
          </span>
          <button onClick={nextMonth} aria-label="Mois suivant" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-sand transition-colors text-ink-soft">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M6 3l5 5-5 5"/></svg>
          </button>
        </div>
      </div>

      {/* Grille */}
      <div className="bg-cream rounded-2xl border border-sand-warm overflow-hidden">
        {/* En-têtes jours */}
        <div className="grid grid-cols-7 bg-sand">
          {JOURS.map(j => (
            <div key={j} className="text-center py-2 font-manrope text-xs font-semibold text-ink-soft">{j}</div>
          ))}
        </div>

        {/* Cellules */}
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            const events = day ? (eventsByDay[day] ?? []) : []
            const isToday = day === todayDay
            return (
              <div
                key={idx}
                className={`min-h-[52px] p-1 border-t border-sand-warm/50 ${!day ? 'bg-sand/30' : ''}`}
              >
                {day && (
                  <>
                    <span className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-manrope font-medium ${
                      isToday ? 'bg-terracotta text-white' : 'text-ink-soft'
                    }`}>
                      {day}
                    </span>
                    <div className="flex flex-wrap gap-0.5 mt-0.5">
                      {events.slice(0, 3).map(ev => (
                        <span
                          key={ev.id}
                          className={`w-1.5 h-1.5 rounded-full ${COULEURS[ev.color]?.dot ?? 'bg-terracotta'}`}
                        />
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
            const dateLabel = new Date(ev.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
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

      {/* Ajouter un événement */}
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
          {/* Sélecteur couleur */}
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
            <button type="button" onClick={() => setShowForm(false)} className="font-manrope text-sm text-ink-soft hover:text-ink px-3 py-1.5">Annuler</button>
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
```

---

### Task 6 : CarteInteractive

**Files:**
- Create: `src/components/agenda/CarteInteractive.tsx`

- [ ] **Step 1 : Créer le composant**

```typescript
// src/components/agenda/CarteInteractive.tsx
'use client'

import { useEffect, useState } from 'react'

function heureLocale(timezone: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    hour:   '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: timezone,
    hour12: false,
  }).format(new Date())
}

function dateLocale(timezone: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: timezone,
  }).format(new Date())
}

export default function CarteInteractive() {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  // tick dépendance pour re-rendre chaque seconde
  void tick

  const lisbonneHeure = heureLocale('Europe/Lisbon')
  const tunisHeure    = heureLocale('Africa/Tunis')
  const lisbonneDate  = dateLocale('Europe/Lisbon')
  const tunisDate     = dateLocale('Africa/Tunis')

  return (
    <section>
      <h2 className="font-manrope font-semibold text-ink mb-4">Lisbonne ↔ Tunis</h2>

      <div className="relative bg-gradient-to-br from-azur/10 via-cream to-sand rounded-2xl p-6 border border-azur/20 overflow-hidden">
        {/* Décoration mer */}
        <div className="absolute inset-0 pointer-events-none">
          <svg viewBox="0 0 480 200" className="w-full h-full opacity-10" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
            <ellipse cx="240" cy="100" rx="280" ry="80" fill="#2E5C8A" />
            <path d="M0,60 Q40,50 80,65 Q120,80 160,60 Q200,40 240,60 Q280,80 320,55 Q360,30 400,60 Q440,90 480,65 L480,200 L0,200 Z" fill="#2E5C8A" opacity="0.5" />
          </svg>
        </div>

        <div className="relative flex items-center justify-between gap-4">
          {/* Lisbonne */}
          <div className="flex flex-col items-center gap-1 flex-1">
            <span className="text-4xl" role="img" aria-label="Drapeau Portugal">🇵🇹</span>
            <h3 className="font-fraunces font-bold text-ink text-lg">Lisbonne</h3>
            <p className="font-manrope tabular-nums text-2xl font-bold text-terracotta">{lisbonneHeure}</p>
            <p className="font-manrope text-xs text-ink-soft capitalize text-center">{lisbonneDate}</p>
            <p className="font-manrope text-xs text-terracotta font-medium mt-1">Papa 💙</p>
          </div>

          {/* Séparateur */}
          <div className="flex flex-col items-center gap-2 px-2">
            <span className="text-lg" aria-hidden="true">✈️</span>
            <div className="flex flex-col items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="w-1 h-1 rounded-full bg-azur/40" />
              ))}
            </div>
            <p className="font-manrope text-xs text-ink-soft text-center leading-tight">
              ~2 000 km
            </p>
            <div className="flex flex-col items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="w-1 h-1 rounded-full bg-azur/40" />
              ))}
            </div>
          </div>

          {/* Tunis */}
          <div className="flex flex-col items-center gap-1 flex-1">
            <span className="text-4xl" role="img" aria-label="Drapeau Tunisie">🇹🇳</span>
            <h3 className="font-fraunces font-bold text-ink text-lg">Tunis</h3>
            <p className="font-manrope tabular-nums text-2xl font-bold text-olive">{tunisHeure}</p>
            <p className="font-manrope text-xs text-ink-soft capitalize text-center">{tunisDate}</p>
            <p className="font-manrope text-xs text-olive font-medium mt-1">Sandra & Sarah 💚</p>
          </div>
        </div>
      </div>
    </section>
  )
}
```

---

### Task 7 : NavBar + vérification TypeScript + commit

**Files:**
- Modify: `src/components/NavBar.tsx`

- [ ] **Step 1 : Ajouter le lien Agenda dans la NavBar**

Ajouter après le lien Atelier (avant le bloc `ml-auto`) :

```typescript
{/* Agenda */}
<Link
  href="/agenda"
  className="flex items-center gap-1 text-ink-soft hover:text-terracotta transition-colors"
  aria-label="Agenda"
>
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
  <span className="text-xs font-manrope hidden sm:inline">Agenda</span>
</Link>
```

- [ ] **Step 2 : Vérifier les types**

```bash
npx tsc --noEmit
```

Sortie attendue : aucune erreur.

- [ ] **Step 3 : Exécuter le SQL dans Supabase**

Dashboard Supabase → SQL Editor → coller `supabase/etape7-schema.sql` → Run.

- [ ] **Step 4 : Tester en local**

`npm run dev` et vérifier :
- http://localhost:3000/agenda → comptes à rebours Sandra/Sarah + calendrier + carte
- Ajouter un événement → apparaît dans la grille
- Ajouter un compte à rebours → apparaît dans les cartes
- Heure Lisbonne et Tunis se mettent à jour chaque seconde

- [ ] **Step 5 : Committer + pousser**

```bash
git add supabase/etape7-schema.sql \
        src/types/agenda.ts \
        src/app/actions/agenda.ts \
        src/app/agenda/page.tsx \
        src/components/agenda/AgendaClient.tsx \
        src/components/agenda/CalendrierMensuel.tsx \
        src/components/agenda/CompteAReboursSection.tsx \
        src/components/agenda/CarteInteractive.tsx \
        src/components/NavBar.tsx
git commit -m "feat(etape7): agenda familial + comptes à rebours + carte Lisbonne/Tunis"
git push origin main
```
