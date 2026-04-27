# Étape 6 — Album photos + Coin créatif de Sarah

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter une page Album qui affiche toutes les photos de la famille en galerie, et un Coin créatif où les membres (notamment Sarah 8 ans) peuvent dessiner directement sur un canvas HTML5 et sauvegarder leurs créations.

**Architecture:** L'Album réutilise la table `posts` existante (type='photo') — aucun nouveau SQL. Le Coin créatif utilise une nouvelle table `creations`. Les deux pages sont des Server Components pour le SSR ; les parties interactives (lightbox, canvas) sont des Client Components. Le canvas exporte en PNG via `canvas.toBlob()` → `uploadMedia` → `saveCreation`.

**Tech Stack:** Next.js 15 App Router, HTML5 Canvas API, Supabase (table creations + RLS), `uploadMedia` server action existant.

---

## Fichiers

| Action | Fichier | Responsabilité |
|--------|---------|----------------|
| Créer | `supabase/etape6-schema.sql` | Table creations + RLS + Realtime |
| Créer | `src/types/creation.ts` | Type TypeScript Creation |
| Créer | `src/app/actions/atelier.ts` | saveCreation, deleteCreation |
| Créer | `src/app/album/page.tsx` | Page galerie photos (server) |
| Créer | `src/components/album/PhotoGrid.tsx` | Grille + lightbox (client) |
| Créer | `src/app/atelier/page.tsx` | Page coin créatif (server) |
| Créer | `src/components/atelier/AtelierClient.tsx` | Wrapper client (state + router.refresh) |
| Créer | `src/components/atelier/DrawingCanvas.tsx` | Canvas HTML5 (mouse + touch) |
| Créer | `src/components/atelier/CreationCard.tsx` | Carte création + suppression |
| Modifier | `src/components/NavBar.tsx` | Ajouter liens Album + Atelier |

---

### Task 1 : SQL creations

**Files:**
- Create: `supabase/etape6-schema.sql`

- [ ] **Step 1 : Créer le fichier SQL**

```sql
-- supabase/etape6-schema.sql
CREATE TABLE IF NOT EXISTS creations (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      TEXT,
  media_url  TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX creations_author_idx ON creations (author_id, created_at);

ALTER TABLE creations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "famille peut voir" ON creations
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "auteur peut créer" ON creations
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "auteur peut supprimer" ON creations
  FOR DELETE USING (auth.uid() = author_id);

ALTER PUBLICATION supabase_realtime ADD TABLE creations;
```

- [ ] **Step 2 : Exécuter dans Supabase**

Dashboard Supabase → SQL Editor → coller le contenu → Run.

Vérifier que la table `creations` apparaît dans Table Editor.

---

### Task 2 : Type TypeScript + server actions atelier

**Files:**
- Create: `src/types/creation.ts`
- Create: `src/app/actions/atelier.ts`

- [ ] **Step 1 : Créer le type**

```typescript
// src/types/creation.ts
export type Creation = {
  id: string
  author_id: string
  title: string | null
  media_url: string
  created_at: string
  profiles: { email: string; nom: string } | null
}
```

- [ ] **Step 2 : Créer les server actions**

```typescript
// src/app/actions/atelier.ts
'use server'

import { createClient } from '@/lib/supabase/server'

export async function saveCreation(mediaUrl: string, title?: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { error } = await supabase.from('creations').insert({
    author_id: user.id,
    media_url: mediaUrl,
    title:     title?.trim() || null,
  })
  if (error) throw new Error(error.message)
}

export async function deleteCreation(creationId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { error } = await supabase
    .from('creations')
    .delete()
    .eq('id', creationId)
    .eq('author_id', user.id)
  if (error) throw new Error(error.message)
}
```

---

### Task 3 : Page Album + PhotoGrid

**Files:**
- Create: `src/app/album/page.tsx`
- Create: `src/components/album/PhotoGrid.tsx`

- [ ] **Step 1 : Créer la page Album (server)**

```typescript
// src/app/album/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NavBar from '@/components/NavBar'
import PhotoGrid from '@/components/album/PhotoGrid'

export default async function AlbumPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: photos } = await supabase
    .from('posts')
    .select('id, author_id, media_url, created_at, profiles(email, nom)')
    .eq('type', 'photo')
    .order('created_at', { ascending: false })

  return (
    <>
      <NavBar />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="font-fraunces text-2xl font-bold text-ink mb-6">
          Notre Album 📷
        </h1>
        <PhotoGrid
          photos={(photos ?? []) as Parameters<typeof PhotoGrid>[0]['photos']}
          currentUserId={user.id}
        />
      </main>
    </>
  )
}
```

- [ ] **Step 2 : Créer PhotoGrid avec lightbox**

```typescript
// src/components/album/PhotoGrid.tsx
'use client'

import { useState, useEffect, useTransition } from 'react'
import { deletePost } from '@/app/actions/posts'
import { avatarFromEmail, tempsRelatif } from '@/lib/avatar'

type Photo = {
  id: string
  author_id: string
  media_url: string
  created_at: string
  profiles: { email: string; nom: string } | null
}

interface PhotoGridProps {
  photos: Photo[]
  currentUserId: string
}

export default function PhotoGrid({ photos, currentUserId }: PhotoGridProps) {
  const [selected, setSelected] = useState<Photo | null>(null)
  const [isPending, startTransition] = useTransition()

  // Fermer le lightbox avec Échap
  useEffect(() => {
    if (!selected) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selected])

  if (!photos.length) {
    return (
      <p className="font-manrope text-ink-soft text-center py-16">
        Aucune photo partagée pour l'instant. Partagez une photo dans la timeline !
      </p>
    )
  }

  const handleDelete = (photo: Photo) => {
    if (!confirm('Supprimer cette photo de l\'album ?')) return
    startTransition(async () => {
      await deletePost(photo.id)
      if (selected?.id === photo.id) setSelected(null)
    })
  }

  return (
    <>
      {/* Grille */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {photos.map((photo) => {
          const avatar = avatarFromEmail(photo.profiles?.email ?? '')
          const isOwn = photo.author_id === currentUserId
          return (
            <div key={photo.id} className="relative group">
              <button
                onClick={() => setSelected(photo)}
                className="block w-full aspect-square rounded-xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-terracotta"
                aria-label={`Photo de ${avatar.nom}`}
              >
                <img
                  src={photo.media_url}
                  alt={`Photo de ${avatar.nom}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </button>

              {/* Badge auteur */}
              <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/50 rounded-full px-2 py-0.5">
                <span
                  className={`w-4 h-4 rounded-full ${avatar.couleurBg} flex items-center justify-center text-white text-xs font-bold`}
                >
                  {avatar.initiale}
                </span>
                <span className="font-manrope text-white text-xs">{avatar.nom}</span>
              </div>

              {/* Supprimer (propre photo) */}
              {isOwn && (
                <button
                  onClick={() => handleDelete(photo)}
                  disabled={isPending}
                  aria-label="Supprimer cette photo"
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-terracotta disabled:opacity-30"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
                    <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Lightbox */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Photo en grand format"
        >
          <div
            className="relative max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selected.media_url}
              alt="Photo agrandie"
              className="w-full max-h-[80vh] object-contain rounded-xl"
            />

            {/* Infos */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {(() => {
                  const av = avatarFromEmail(selected.profiles?.email ?? '')
                  return (
                    <>
                      <span className={`w-8 h-8 rounded-full ${av.couleurBg} flex items-center justify-center text-white text-sm font-bold`}>
                        {av.initiale}
                      </span>
                      <div>
                        <p className="font-manrope text-white text-sm font-semibold">{av.nom}</p>
                        <p className="font-manrope text-white/60 text-xs">{tempsRelatif(selected.created_at)}</p>
                      </div>
                    </>
                  )
                })()}
              </div>

              <button
                onClick={() => setSelected(null)}
                className="font-manrope text-white/60 hover:text-white text-sm underline underline-offset-2"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

---

### Task 4 : Page Atelier + Canvas + CreationCard

**Files:**
- Create: `src/app/atelier/page.tsx`
- Create: `src/components/atelier/AtelierClient.tsx`
- Create: `src/components/atelier/DrawingCanvas.tsx`
- Create: `src/components/atelier/CreationCard.tsx`

- [ ] **Step 1 : Créer la page Atelier (server)**

```typescript
// src/app/atelier/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NavBar from '@/components/NavBar'
import AtelierClient from '@/components/atelier/AtelierClient'
import type { Creation } from '@/types/creation'

export default async function AtelierPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: creations } = await supabase
    .from('creations')
    .select('id, author_id, title, media_url, created_at, profiles(email, nom)')
    .order('created_at', { ascending: false })

  return (
    <>
      <NavBar />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="font-fraunces text-2xl font-bold text-ink mb-2">
          Le Coin créatif 🎨
        </h1>
        <p className="font-manrope text-ink-soft text-sm mb-6">
          Dessine et partage tes créations avec la famille !
        </p>
        <AtelierClient
          initialCreations={(creations ?? []) as Creation[]}
          currentUserId={user.id}
        />
      </main>
    </>
  )
}
```

- [ ] **Step 2 : Créer AtelierClient (wrapper client)**

```typescript
// src/components/atelier/AtelierClient.tsx
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
      {/* Zone de dessin */}
      <section>
        <h2 className="font-manrope font-semibold text-ink mb-3">Mon dessin</h2>
        <DrawingCanvas onSaved={() => router.refresh()} />
      </section>

      {/* Galerie des créations */}
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
```

- [ ] **Step 3 : Créer DrawingCanvas**

```typescript
// src/components/atelier/DrawingCanvas.tsx
'use client'

import { useRef, useEffect, useState } from 'react'
import { uploadMedia } from '@/app/actions/posts'
import { saveCreation } from '@/app/actions/atelier'

const COULEURS = [
  { label: 'Terracotta', value: '#C5563D' },
  { label: 'Olive',      value: '#6B7B3F' },
  { label: 'Azur',       value: '#2E5C8A' },
  { label: 'Or',         value: '#D4A04C' },
  { label: 'Rose',       value: '#E8A598' },
  { label: 'Encre',      value: '#2A1F18' },
  { label: 'Blanc',      value: '#FAF4EA' },
]

const TAILLES = [
  { label: 'Fin',   value: 3 },
  { label: 'Moyen', value: 8 },
  { label: 'Épais', value: 20 },
]

interface DrawingCanvasProps {
  onSaved: () => void
}

export default function DrawingCanvas({ onSaved }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawingRef = useRef(false)
  const [couleur, setCouleur] = useState('#2A1F18')
  const [taille, setTaille] = useState(8)
  const [efface, setEfface] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Initialiser le fond crème
  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#FAF4EA'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [])

  // Calculer la position relative au canvas (gère le scaling CSS)
  function getPos(clientX: number, clientY: number) {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    }
  }

  function getCtx() {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.strokeStyle = efface ? '#FAF4EA' : couleur
    ctx.lineWidth = efface ? taille * 3 : taille
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    return ctx
  }

  // Souris
  function onMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    const { x, y } = getPos(e.clientX, e.clientY)
    const ctx = getCtx()
    ctx.beginPath()
    ctx.moveTo(x, y)
    isDrawingRef.current = true
  }

  function onMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current) return
    const { x, y } = getPos(e.clientX, e.clientY)
    const ctx = getCtx()
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  function onMouseUp() {
    isDrawingRef.current = false
  }

  // Tactile (pour Sarah sur tablette/téléphone)
  function onTouchStart(e: React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault()
    const touch = e.touches[0]
    const { x, y } = getPos(touch.clientX, touch.clientY)
    const ctx = getCtx()
    ctx.beginPath()
    ctx.moveTo(x, y)
    isDrawingRef.current = true
  }

  function onTouchMove(e: React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault()
    if (!isDrawingRef.current) return
    const touch = e.touches[0]
    const { x, y } = getPos(touch.clientX, touch.clientY)
    const ctx = getCtx()
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  function onTouchEnd() {
    isDrawingRef.current = false
  }

  function handleClear() {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#FAF4EA'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  async function handleSave() {
    const canvas = canvasRef.current!
    setIsSaving(true)
    canvas.toBlob(async (blob) => {
      if (!blob) { setIsSaving(false); return }
      try {
        const form = new FormData()
        form.append('file', blob, 'dessin.png')
        const url = await uploadMedia(form)
        await saveCreation(url)
        handleClear()
        onSaved()
      } catch (err) {
        console.error('Erreur sauvegarde dessin:', err)
      } finally {
        setIsSaving(false)
      }
    }, 'image/png')
  }

  return (
    <div className="space-y-3">
      {/* Palette couleurs */}
      <div className="flex items-center gap-2 flex-wrap">
        {COULEURS.map((c) => (
          <button
            key={c.value}
            onClick={() => { setCouleur(c.value); setEfface(false) }}
            aria-label={c.label}
            className={`w-8 h-8 rounded-full border-2 transition-transform active:scale-95 ${
              couleur === c.value && !efface ? 'border-ink scale-110' : 'border-transparent'
            }`}
            style={{ background: c.value, boxShadow: c.value === '#FAF4EA' ? 'inset 0 0 0 1px #5A4A3F' : undefined }}
          />
        ))}

        {/* Gomme */}
        <button
          onClick={() => setEfface(!efface)}
          aria-label="Gomme"
          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm transition-transform active:scale-95 ${
            efface ? 'border-ink bg-sand' : 'border-sand-warm bg-sand'
          }`}
        >
          ✏️
        </button>
      </div>

      {/* Taille du pinceau */}
      <div className="flex items-center gap-2">
        {TAILLES.map((t) => (
          <button
            key={t.value}
            onClick={() => setTaille(t.value)}
            aria-label={`Pinceau ${t.label}`}
            className={`flex items-center justify-center rounded-full border-2 transition-transform active:scale-95 ${
              taille === t.value ? 'border-ink' : 'border-sand-warm'
            }`}
            style={{ width: Math.max(t.value * 2 + 12, 28), height: Math.max(t.value * 2 + 12, 28) }}
          >
            <span
              className="rounded-full bg-ink"
              style={{ width: t.value, height: t.value }}
            />
          </button>
        ))}
      </div>

      {/* Canvas */}
      <div className="rounded-xl overflow-hidden border-2 border-sand-warm shadow-sm">
        <canvas
          ref={canvasRef}
          width={640}
          height={380}
          className="w-full touch-none cursor-crosshair"
          style={{ display: 'block' }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        />
      </div>

      {/* Boutons action */}
      <div className="flex gap-3">
        <button
          onClick={handleClear}
          className="font-manrope text-sm text-ink-soft border border-sand-warm rounded-lg px-4 py-2 hover:border-terracotta hover:text-terracotta transition-colors"
        >
          Effacer tout
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="font-manrope text-sm font-semibold bg-terracotta text-white rounded-lg px-6 py-2 hover:bg-terracotta-deep transition-colors disabled:opacity-50 active:scale-95"
        >
          {isSaving ? 'Enregistrement…' : 'Partager mon dessin ✨'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4 : Créer CreationCard**

```typescript
// src/components/atelier/CreationCard.tsx
'use client'

import { useTransition } from 'react'
import { deleteCreation } from '@/app/actions/atelier'
import { avatarFromEmail, tempsRelatif } from '@/lib/avatar'
import type { Creation } from '@/types/creation'

interface CreationCardProps {
  creation: Creation
  currentUserId: string
  onDeleted: () => void
}

export default function CreationCard({ creation, currentUserId, onDeleted }: CreationCardProps) {
  const [isPending, startTransition] = useTransition()
  const avatar = avatarFromEmail(creation.profiles?.email ?? '')
  const isOwn = creation.author_id === currentUserId

  function handleDelete() {
    if (!confirm('Supprimer cette création ?')) return
    startTransition(async () => {
      await deleteCreation(creation.id)
      onDeleted()
    })
  }

  return (
    <div className="relative group rounded-xl overflow-hidden border border-sand-warm shadow-sm">
      <img
        src={creation.media_url}
        alt={creation.title ?? `Dessin de ${avatar.nom}`}
        className="w-full aspect-square object-cover"
        loading="lazy"
      />

      {/* Titre si présent */}
      {creation.title && (
        <div className="px-2 py-1 bg-jasmine">
          <p className="font-caveat text-ink text-sm truncate">{creation.title}</p>
        </div>
      )}

      {/* Badge auteur */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/50 rounded-full px-2 py-0.5">
        <span className={`w-4 h-4 rounded-full ${avatar.couleurBg} flex items-center justify-center text-white text-xs font-bold`}>
          {avatar.initiale}
        </span>
        <span className="font-manrope text-white text-xs">{tempsRelatif(creation.created_at)}</span>
      </div>

      {/* Supprimer */}
      {isOwn && (
        <button
          onClick={handleDelete}
          disabled={isPending}
          aria-label="Supprimer cette création"
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-terracotta disabled:opacity-30"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      )}
    </div>
  )
}
```

---

### Task 5 : Mise à jour NavBar

**Files:**
- Modify: `src/components/NavBar.tsx`

- [ ] **Step 1 : Ajouter les liens Album et Atelier**

Remplacer l'intégralité de `src/components/NavBar.tsx` par :

```typescript
// src/components/NavBar.tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { MEMBRES } from '@/lib/membres'
import { avatarFromEmail } from '@/lib/avatar'

export default async function NavBar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const autresMembres = MEMBRES.filter(m => m.id !== user.id)

  return (
    <nav className="sticky top-0 z-50 bg-cream border-b border-terracotta/20 shadow-sm">
      <div className="max-w-lg mx-auto px-4 py-2 flex items-center gap-3">
        {/* Timeline */}
        <Link
          href="/"
          className="flex items-center gap-1 text-ink-soft hover:text-terracotta transition-colors"
          aria-label="Timeline familiale"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span className="text-xs font-manrope hidden sm:inline">Accueil</span>
        </Link>

        {/* Album */}
        <Link
          href="/album"
          className="flex items-center gap-1 text-ink-soft hover:text-terracotta transition-colors"
          aria-label="Album photos"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <span className="text-xs font-manrope hidden sm:inline">Album</span>
        </Link>

        {/* Atelier créatif */}
        <Link
          href="/atelier"
          className="flex items-center gap-1 text-ink-soft hover:text-terracotta transition-colors"
          aria-label="Coin créatif"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 19l7-7 3 3-7 7-3-3z"/>
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
            <path d="M2 2l7.586 7.586"/>
            <circle cx="11" cy="11" r="2"/>
          </svg>
          <span className="text-xs font-manrope hidden sm:inline">Atelier</span>
        </Link>

        {/* Chats des autres membres */}
        <div className="flex items-center gap-3 ml-auto">
          {autresMembres.map(membre => {
            const avatar = avatarFromEmail(membre.email)
            return (
              <Link
                key={membre.id}
                href={`/chats/${membre.id}`}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                aria-label={`Chat avec ${avatar.nom}`}
              >
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold font-manrope ${avatar.couleurBg}`}
                  aria-hidden="true"
                >
                  {avatar.initiale}
                </span>
                <span className="text-sm font-manrope text-ink hidden sm:inline">
                  {avatar.nom}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
```

---

### Task 6 : Vérification TypeScript + commit

**Files:**
- (aucun fichier nouveau)

- [ ] **Step 1 : Vérifier les types**

```bash
npx tsc --noEmit
```

Sortie attendue : aucune erreur.

- [ ] **Step 2 : Tester en local**

Démarrer `npm run dev` et vérifier :
- http://localhost:3000/album → affiche une grille de photos, clic → lightbox
- http://localhost:3000/atelier → affiche le canvas + palette + grille des créations
- NavBar → 3 icônes à gauche (accueil, album, atelier) + avatars à droite

Dessiner sur le canvas, cliquer "Partager" → la création apparaît dans la grille.

- [ ] **Step 3 : Exécuter le SQL dans Supabase**

Dashboard Supabase → SQL Editor → coller `supabase/etape6-schema.sql` → Run.

- [ ] **Step 4 : Committer**

```bash
git add supabase/etape6-schema.sql \
        src/types/creation.ts \
        src/app/actions/atelier.ts \
        src/app/album/page.tsx \
        src/components/album/PhotoGrid.tsx \
        src/app/atelier/page.tsx \
        src/components/atelier/AtelierClient.tsx \
        src/components/atelier/DrawingCanvas.tsx \
        src/components/atelier/CreationCard.tsx \
        src/components/NavBar.tsx
git commit -m "feat(etape6): album photos + coin créatif avec canvas HTML5"
```

- [ ] **Step 5 : Déployer**

```bash
git push origin main
```

---

## Notes

- **Album** : les photos viennent directement de la table `posts` (type='photo') — aucune duplication. Supprimer une photo de l'album la supprime aussi de la timeline.
- **Canvas tactile** : `touch-none` (CSS) + `e.preventDefault()` empêchent le scroll pendant le dessin sur mobile pour Sarah.
- **Scaling canvas** : la fonction `getPos()` corrige les coordonnées quand le canvas est redimensionné par CSS (`canvas.width / rect.width`).
- **router.refresh()** : recharge les données server-side sans re-monter les composants client — c'est le pattern Next.js 15 pour actualiser après une mutation server action.
