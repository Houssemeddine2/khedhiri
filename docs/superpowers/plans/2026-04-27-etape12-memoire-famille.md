# Étape 12 — Boîte à mémoire + Arbre généalogique Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter deux pages à khedhiri.me — `/memoire` (mur de polaroïds partagé par toute la famille) et `/famille` (arbre généalogique avec cartes cliquables, deux côtés).

**Architecture:** Deux pages Next.js Server Components qui fetchent les données initiales et passent à des Client Components pour l'interactivité. Les mutations passent par des Server Actions (`'use server'`). Les fichiers (photos, audios) sont uploadés dans Supabase Storage via FormData.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS, Supabase (DB + Storage + RLS), Server Actions

---

## Contexte essentiel pour l'implémenteur

- **Papa ID** : `b6025d5f-77d5-4208-b489-bcc717ebc01c` (email : `houssem@khedhiri.me`)
- **Sandra ID** : `1a0967e9-91e0-48f6-a3da-752255274153`
- **Sarah ID** : `617eff77-47ed-40e0-b784-c027183c9bee`
- **Palette** : `terracotta: #C5563D`, `azur: #2E5C8A`, `sand: #F4E8D8`, `cream: #FAF4EA`, `gold: #D4A04C`, `rose: #E8A598`, `ink: #2A1F18`
- **Fonts** : `font-fraunces` (titres), `font-manrope` (texte), `font-caveat` (cursif)
- **Pattern page** : server component → `createClient()` → `auth.getUser()` → redirect si non auth → fetch data → `<NavBar />` + `<main className="max-w-2xl mx-auto px-4 py-6">`
- **Pattern action** : `'use server'` → `createClient()` → `auth.getUser()` → mutation Supabase
- **Pattern upload** : `FormData` → `supabase.storage.from(bucket).upload(path, file)` → retourne URL publique via `supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl`
- **`creations` table existante** : `id, author_id, title, media_url, created_at` — les dessins de Sarah viennent de là
- **Pas de tests unitaires** dans ce projet — tester en lançant `npm run dev` et vérifier manuellement dans le navigateur

---

## Structure des fichiers

**Créer :**
- `src/types/memoire.ts`
- `src/types/famille.ts`
- `src/app/actions/memoire.ts`
- `src/app/actions/famille.ts`
- `src/app/memoire/page.tsx`
- `src/app/famille/page.tsx`
- `src/components/memoire/PolaroidCard.tsx`
- `src/components/memoire/SouvenirDetail.tsx`
- `src/components/memoire/AjouterSouvenir.tsx`
- `src/components/memoire/MurSouvenirs.tsx`
- `src/components/famille/MembreCard.tsx`
- `src/components/famille/MembreDetail.tsx`
- `src/components/famille/AjouterAnecdote.tsx`
- `src/components/famille/AjouterMembre.tsx`
- `src/components/famille/ArbreGenealogique.tsx`

**Modifier :**
- `src/components/NavBar.tsx` — ajouter liens Souvenirs + Famille

---

## Task 1 : Migration SQL

**Files:**
- Aucun fichier à créer — migration à appliquer dans le dashboard Supabase

- [ ] **Step 1 : Ouvrir le SQL Editor de Supabase**

Va sur https://supabase.com/dashboard → projet khedhiri → SQL Editor → New query.

- [ ] **Step 2 : Exécuter la migration**

```sql
-- Table souvenirs
create table memoires (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  titre text not null,
  texte text,
  photo_url text,
  audio_url text,
  creation_id uuid references creations(id) on delete set null,
  date_souvenir date not null default current_date,
  created_at timestamptz default now()
);

alter table memoires enable row level security;

create policy "lecture memoires" on memoires
  for select using (auth.uid() is not null);

create policy "insertion memoires" on memoires
  for insert with check (auth.uid() = user_id);

create policy "suppression memoires" on memoires
  for delete using (
    auth.uid() = user_id
    or auth.uid() = 'b6025d5f-77d5-4208-b489-bcc717ebc01c'
  );

-- Table membres de la famille
create table famille_membres (
  id uuid primary key default gen_random_uuid(),
  prenom text not null,
  nom text,
  surnom text,
  photo_url text,
  date_naissance date,
  lieu_naissance text,
  cote text not null check (cote in ('khedhiri', 'maternel')),
  relation text not null,
  generation int not null default 1,
  bio text,
  created_by uuid references auth.users not null,
  created_at timestamptz default now()
);

alter table famille_membres enable row level security;

create policy "lecture famille" on famille_membres
  for select using (auth.uid() is not null);

create policy "insertion famille" on famille_membres
  for insert with check (auth.uid() is not null);

create policy "modification famille" on famille_membres
  for update using (auth.uid() = 'b6025d5f-77d5-4208-b489-bcc717ebc01c');

create policy "suppression famille" on famille_membres
  for delete using (auth.uid() = 'b6025d5f-77d5-4208-b489-bcc717ebc01c');

-- Table anecdotes (tout le monde peut ajouter)
create table famille_anecdotes (
  id uuid primary key default gen_random_uuid(),
  membre_id uuid references famille_membres(id) on delete cascade not null,
  user_id uuid references auth.users not null,
  contenu text not null,
  created_at timestamptz default now()
);

alter table famille_anecdotes enable row level security;

create policy "lecture anecdotes" on famille_anecdotes
  for select using (auth.uid() is not null);

create policy "insertion anecdotes" on famille_anecdotes
  for insert with check (auth.uid() = user_id);

create policy "suppression anecdotes" on famille_anecdotes
  for delete using (
    auth.uid() = user_id
    or auth.uid() = 'b6025d5f-77d5-4208-b489-bcc717ebc01c'
  );
```

- [ ] **Step 3 : Créer les buckets Storage**

Dans Supabase Dashboard → Storage → New bucket :
1. Nom : `memoires` — Public : ✅
2. Nom : `famille` — Public : ✅

- [ ] **Step 4 : Vérifier**

Dans Supabase → Table Editor, vérifier que les 3 tables apparaissent : `memoires`, `famille_membres`, `famille_anecdotes`.

---

## Task 2 : Types TypeScript

**Files:**
- Create: `src/types/memoire.ts`
- Create: `src/types/famille.ts`

- [ ] **Step 1 : Créer `src/types/memoire.ts`**

```typescript
export type Souvenir = {
  id: string
  user_id: string
  titre: string
  texte: string | null
  photo_url: string | null
  audio_url: string | null
  creation_id: string | null
  date_souvenir: string
  created_at: string
  profiles: { email: string; nom: string; avatar_url?: string | null; couleur?: string | null } | null
  creations: { media_url: string; title: string | null } | null
}
```

- [ ] **Step 2 : Créer `src/types/famille.ts`**

```typescript
export type MembreFamille = {
  id: string
  prenom: string
  nom: string | null
  surnom: string | null
  photo_url: string | null
  date_naissance: string | null
  lieu_naissance: string | null
  cote: 'khedhiri' | 'maternel'
  relation: string
  generation: number
  bio: string | null
  created_by: string
  created_at: string
}

export type Anecdote = {
  id: string
  membre_id: string
  user_id: string
  contenu: string
  created_at: string
  profiles: { email: string; nom: string; avatar_url?: string | null; couleur?: string | null } | null
}
```

- [ ] **Step 3 : Commit**

```bash
git add src/types/memoire.ts src/types/famille.ts
git commit -m "feat(etape12): types Souvenir, MembreFamille, Anecdote"
```

---

## Task 3 : Server Actions — Mémoire

**Files:**
- Create: `src/app/actions/memoire.ts`

- [ ] **Step 1 : Créer `src/app/actions/memoire.ts`**

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function uploadFichierSouvenir(formData: FormData, type: 'photo' | 'audio'): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const file = formData.get('file') as File | null
  if (!file) throw new Error('Fichier manquant')

  const ext = file.name.split('.').pop() ?? 'bin'
  const path = `${type}s/${user.id}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('memoires').upload(path, file)
  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from('memoires').getPublicUrl(path)
  return data.publicUrl
}

export async function ajouterSouvenir(params: {
  titre: string
  texte?: string
  photoUrl?: string
  audioUrl?: string
  creationId?: string
  dateSouvenir: string
}): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { error } = await supabase.from('memoires').insert({
    user_id: user.id,
    titre: params.titre.trim(),
    texte: params.texte?.trim() || null,
    photo_url: params.photoUrl ?? null,
    audio_url: params.audioUrl ?? null,
    creation_id: params.creationId ?? null,
    date_souvenir: params.dateSouvenir,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/memoire')
}

export async function supprimerSouvenir(id: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const PAPA_ID = 'b6025d5f-77d5-4208-b489-bcc717ebc01c'
  const query = supabase.from('memoires').delete().eq('id', id)
  const { error } = user.id === PAPA_ID
    ? await query
    : await query.eq('user_id', user.id)
  if (error) throw new Error(error.message)
  revalidatePath('/memoire')
}
```

- [ ] **Step 2 : Vérifier la compilation**

```bash
cd C:/khedhiri && npx tsc --noEmit
```
Attendu : aucune erreur TypeScript.

- [ ] **Step 3 : Commit**

```bash
git add src/app/actions/memoire.ts
git commit -m "feat(etape12): server actions mémoire (upload, ajout, suppression)"
```

---

## Task 4 : Server Actions — Famille

**Files:**
- Create: `src/app/actions/famille.ts`

- [ ] **Step 1 : Créer `src/app/actions/famille.ts`**

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const PAPA_ID = 'b6025d5f-77d5-4208-b489-bcc717ebc01c'

export async function uploadPhotoMembre(formData: FormData): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const file = formData.get('file') as File | null
  if (!file) throw new Error('Fichier manquant')

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('famille').upload(path, file)
  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from('famille').getPublicUrl(path)
  return data.publicUrl
}

export async function ajouterMembre(params: {
  prenom: string
  nom?: string
  surnom?: string
  photoUrl?: string
  dateNaissance?: string
  lieuNaissance?: string
  cote: 'khedhiri' | 'maternel'
  relation: string
  generation: number
  bio?: string
}): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { error } = await supabase.from('famille_membres').insert({
    prenom: params.prenom.trim(),
    nom: params.nom?.trim() || null,
    surnom: params.surnom?.trim() || null,
    photo_url: params.photoUrl ?? null,
    date_naissance: params.dateNaissance || null,
    lieu_naissance: params.lieuNaissance?.trim() || null,
    cote: params.cote,
    relation: params.relation.trim(),
    generation: params.generation,
    bio: params.bio?.trim() || null,
    created_by: user.id,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/famille')
}

export async function supprimerMembre(id: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== PAPA_ID) throw new Error('Non autorisé')

  const { error } = await supabase.from('famille_membres').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/famille')
}

export async function ajouterAnecdote(membreId: string, contenu: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { error } = await supabase.from('famille_anecdotes').insert({
    membre_id: membreId,
    user_id: user.id,
    contenu: contenu.trim(),
  })
  if (error) throw new Error(error.message)
  revalidatePath('/famille')
}

export async function supprimerAnecdote(id: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const query = supabase.from('famille_anecdotes').delete().eq('id', id)
  const { error } = user.id === PAPA_ID
    ? await query
    : await query.eq('user_id', user.id)
  if (error) throw new Error(error.message)
  revalidatePath('/famille')
}
```

- [ ] **Step 2 : Vérifier la compilation**

```bash
npx tsc --noEmit
```
Attendu : aucune erreur TypeScript.

- [ ] **Step 3 : Commit**

```bash
git add src/app/actions/famille.ts
git commit -m "feat(etape12): server actions famille (membres, anecdotes)"
```

---

## Task 5 : NavBar — ajout des deux liens

**Files:**
- Modify: `src/components/NavBar.tsx`

- [ ] **Step 1 : Ajouter les deux liens dans `src/components/NavBar.tsx`**

Après le lien Tuteur (ligne ~110) et avant le bloc Journal intime, insérer :

```tsx
{/* Souvenirs */}
<Link
  href="/memoire"
  className="flex items-center gap-1 text-ink-soft hover:text-terracotta transition-colors"
  aria-label="Boîte à souvenirs"
>
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
  </svg>
  <span className="text-xs font-manrope hidden sm:inline">Souvenirs</span>
</Link>

{/* Famille */}
<Link
  href="/famille"
  className="flex items-center gap-1 text-ink-soft hover:text-terracotta transition-colors"
  aria-label="Arbre généalogique"
>
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
  <span className="text-xs font-manrope hidden sm:inline">Famille</span>
</Link>
```

- [ ] **Step 2 : Vérifier**

```bash
npm run dev
```
Ouvrir http://localhost:3000 → vérifier que les deux liens apparaissent dans la NavBar.

- [ ] **Step 3 : Commit**

```bash
git add src/components/NavBar.tsx
git commit -m "feat(etape12): ajouter liens Souvenirs et Famille dans NavBar"
```

---

## Task 6 : PolaroidCard

**Files:**
- Create: `src/components/memoire/PolaroidCard.tsx`

- [ ] **Step 1 : Créer `src/components/memoire/PolaroidCard.tsx`**

```typescript
'use client'

import type { Souvenir } from '@/types/memoire'
import { avatarFromEmail } from '@/lib/avatar'

interface PolaroidCardProps {
  souvenir: Souvenir
  onClick: () => void
}

function rotationDeg(id: string): number {
  const seed = id.charCodeAt(0) + id.charCodeAt(id.length - 1)
  return (seed % 7) - 3 // -3 à +3 degrés
}

export default function PolaroidCard({ souvenir, onClick }: PolaroidCardProps) {
  const deg = rotationDeg(souvenir.id)
  const auteur = avatarFromEmail(souvenir.profiles?.email ?? '')

  const hasPhoto = !!souvenir.photo_url
  const hasDessin = !!souvenir.creation_id && !!souvenir.creations?.media_url
  const hasAudio = !!souvenir.audio_url
  const imageUrl = souvenir.photo_url ?? souvenir.creations?.media_url ?? null

  return (
    <button
      onClick={onClick}
      className="bg-white p-2 pb-8 shadow-md hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-terracotta"
      style={{ transform: `rotate(${deg}deg)` }}
      aria-label={`Souvenir : ${souvenir.titre}`}
    >
      {/* Image ou placeholder */}
      <div className="w-full aspect-square bg-sand overflow-hidden flex items-center justify-center mb-2">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={souvenir.titre}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : hasAudio ? (
          <span className="text-4xl">🎵</span>
        ) : (
          <span className="text-4xl">✍️</span>
        )}
      </div>

      {/* Légende polaroïd */}
      <p className="font-caveat text-ink text-sm text-center leading-tight px-1 truncate">
        {souvenir.titre}
      </p>
      <p className="font-manrope text-ink-soft text-xs text-center mt-0.5">
        {auteur.prenom} · {new Date(souvenir.date_souvenir).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
      </p>
    </button>
  )
}
```

Note : `avatarFromEmail` existe dans `src/lib/avatar.ts` et retourne `{ nom, prenom, emoji, couleur }`.

- [ ] **Step 2 : Vérifier la compilation**

```bash
npx tsc --noEmit
```
Attendu : aucune erreur.

- [ ] **Step 3 : Commit**

```bash
git add src/components/memoire/PolaroidCard.tsx
git commit -m "feat(etape12): composant PolaroidCard"
```

---

## Task 7 : SouvenirDetail + AjouterSouvenir

**Files:**
- Create: `src/components/memoire/SouvenirDetail.tsx`
- Create: `src/components/memoire/AjouterSouvenir.tsx`

- [ ] **Step 1 : Créer `src/components/memoire/SouvenirDetail.tsx`**

```typescript
'use client'

import { useTransition } from 'react'
import type { Souvenir } from '@/types/memoire'
import { avatarFromEmail } from '@/lib/avatar'
import { supprimerSouvenir } from '@/app/actions/memoire'

interface SouvenirDetailProps {
  souvenir: Souvenir
  currentUserId: string
  isPapa: boolean
  onClose: () => void
}

const PAPA_ID = 'b6025d5f-77d5-4208-b489-bcc717ebc01c'

export default function SouvenirDetail({ souvenir, currentUserId, isPapa, onClose }: SouvenirDetailProps) {
  const [isPending, startTransition] = useTransition()
  const auteur = avatarFromEmail(souvenir.profiles?.email ?? '')
  const peutSupprimer = isPapa || currentUserId === souvenir.user_id
  const imageUrl = souvenir.photo_url ?? souvenir.creations?.media_url ?? null

  function handleSupprimer() {
    if (!confirm('Supprimer ce souvenir ?')) return
    startTransition(async () => {
      await supprimerSouvenir(souvenir.id)
      onClose()
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-jasmine rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-fraunces text-xl font-bold text-ink">{souvenir.titre}</h2>
          <button onClick={onClose} className="text-ink-soft hover:text-ink text-2xl leading-none" aria-label="Fermer">×</button>
        </div>

        {imageUrl && (
          <img src={imageUrl} alt={souvenir.titre} className="w-full rounded-xl mb-4 max-h-64 object-cover" />
        )}

        {souvenir.audio_url && (
          <audio controls src={souvenir.audio_url} className="w-full mb-4" />
        )}

        {souvenir.texte && (
          <p className="font-manrope text-ink text-sm leading-relaxed mb-4 whitespace-pre-wrap">{souvenir.texte}</p>
        )}

        <div className="flex items-center justify-between text-xs font-manrope text-ink-soft">
          <span>Par {souvenir.profiles?.nom ?? auteur.nom} · {new Date(souvenir.date_souvenir).toLocaleDateString('fr-FR', { dateStyle: 'long' })}</span>
          {peutSupprimer && (
            <button
              onClick={handleSupprimer}
              disabled={isPending}
              className="text-terracotta hover:underline disabled:opacity-50"
            >
              Supprimer
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2 : Créer `src/components/memoire/AjouterSouvenir.tsx`**

```typescript
'use client'

import { useState, useTransition } from 'react'
import type { Creation } from '@/types/creation'
import { uploadFichierSouvenir, ajouterSouvenir } from '@/app/actions/memoire'

interface AjouterSouvenirProps {
  creations: Creation[]
  onClose: () => void
}

export default function AjouterSouvenir({ creations, onClose }: AjouterSouvenirProps) {
  const [titre, setTitre] = useState('')
  const [texte, setTexte] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [creationId, setCreationId] = useState<string>('')
  const [isPending, startTransition] = useTransition()
  const [erreur, setErreur] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!titre.trim()) { setErreur('Le titre est obligatoire.'); return }
    setErreur(null)

    startTransition(async () => {
      try {
        let photoUrl: string | undefined
        let audioUrl: string | undefined

        if (photoFile) {
          const fd = new FormData(); fd.append('file', photoFile)
          photoUrl = await uploadFichierSouvenir(fd, 'photo')
        }
        if (audioFile) {
          const fd = new FormData(); fd.append('file', audioFile)
          audioUrl = await uploadFichierSouvenir(fd, 'audio')
        }

        await ajouterSouvenir({
          titre,
          texte: texte || undefined,
          photoUrl,
          audioUrl,
          creationId: creationId || undefined,
          dateSouvenir: date,
        })
        onClose()
      } catch (err) {
        setErreur(err instanceof Error ? err.message : 'Erreur inconnue')
      }
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-jasmine rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-fraunces text-xl font-bold text-ink">Nouveau souvenir</h2>
          <button onClick={onClose} className="text-ink-soft hover:text-ink text-2xl" aria-label="Fermer">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-manrope text-sm font-semibold text-ink mb-1" htmlFor="titre">Titre *</label>
            <input
              id="titre"
              type="text"
              value={titre}
              onChange={e => setTitre(e.target.value)}
              placeholder="Ex: Premier Aïd ensemble à Tunis"
              className="w-full border border-sand-warm rounded-lg px-3 py-2 font-manrope text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-terracotta"
              required
            />
          </div>

          <div>
            <label className="block font-manrope text-sm font-semibold text-ink mb-1" htmlFor="date">Date</label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full border border-sand-warm rounded-lg px-3 py-2 font-manrope text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-terracotta"
            />
          </div>

          <div>
            <label className="block font-manrope text-sm font-semibold text-ink mb-1" htmlFor="texte">Texte (optionnel)</label>
            <textarea
              id="texte"
              value={texte}
              onChange={e => setTexte(e.target.value)}
              rows={3}
              placeholder="Raconte ce moment..."
              className="w-full border border-sand-warm rounded-lg px-3 py-2 font-manrope text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-terracotta resize-none"
            />
          </div>

          <div>
            <label className="block font-manrope text-sm font-semibold text-ink mb-1" htmlFor="photo">Photo (optionnel)</label>
            <input
              id="photo"
              type="file"
              accept="image/*"
              onChange={e => setPhotoFile(e.target.files?.[0] ?? null)}
              className="w-full font-manrope text-sm text-ink"
            />
          </div>

          <div>
            <label className="block font-manrope text-sm font-semibold text-ink mb-1" htmlFor="audio">Audio (optionnel)</label>
            <input
              id="audio"
              type="file"
              accept="audio/*"
              onChange={e => setAudioFile(e.target.files?.[0] ?? null)}
              className="w-full font-manrope text-sm text-ink"
            />
          </div>

          {creations.length > 0 && (
            <div>
              <label className="block font-manrope text-sm font-semibold text-ink mb-1" htmlFor="dessin">Dessin de l'atelier (optionnel)</label>
              <select
                id="dessin"
                value={creationId}
                onChange={e => setCreationId(e.target.value)}
                className="w-full border border-sand-warm rounded-lg px-3 py-2 font-manrope text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-terracotta"
              >
                <option value="">Aucun</option>
                {creations.map(c => (
                  <option key={c.id} value={c.id}>{c.title ?? `Création du ${new Date(c.created_at).toLocaleDateString('fr-FR')}`}</option>
                ))}
              </select>
            </div>
          )}

          {erreur && <p className="font-manrope text-sm text-red-600">{erreur}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl border border-sand-warm font-manrope text-sm text-ink-soft hover:bg-sand transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2 rounded-xl bg-terracotta text-white font-manrope text-sm font-semibold hover:bg-terracotta-deep transition-colors disabled:opacity-50"
            >
              {isPending ? 'Enregistrement...' : 'Ajouter ✨'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 3 : Vérifier la compilation**

```bash
npx tsc --noEmit
```
Attendu : aucune erreur.

- [ ] **Step 4 : Commit**

```bash
git add src/components/memoire/SouvenirDetail.tsx src/components/memoire/AjouterSouvenir.tsx
git commit -m "feat(etape12): modals SouvenirDetail et AjouterSouvenir"
```

---

## Task 8 : MurSouvenirs + page `/memoire`

**Files:**
- Create: `src/components/memoire/MurSouvenirs.tsx`
- Create: `src/app/memoire/page.tsx`

- [ ] **Step 1 : Créer `src/components/memoire/MurSouvenirs.tsx`**

```typescript
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
```

- [ ] **Step 2 : Créer `src/app/memoire/page.tsx`**

```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NavBar from '@/components/NavBar'
import MurSouvenirs from '@/components/memoire/MurSouvenirs'
import type { Souvenir } from '@/types/memoire'
import type { Creation } from '@/types/creation'

const PAPA_EMAIL = 'houssem@khedhiri.me'

export default async function MemoirePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [souvenirRes, creationsRes] = await Promise.all([
    supabase
      .from('memoires')
      .select('id, user_id, titre, texte, photo_url, audio_url, creation_id, date_souvenir, created_at, profiles(email, nom, avatar_url, couleur), creations(media_url, title)')
      .order('date_souvenir', { ascending: false }),
    supabase
      .from('creations')
      .select('id, author_id, title, media_url, created_at, profiles(email, nom, avatar_url, couleur)')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  return (
    <>
      <NavBar />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="font-fraunces text-2xl font-bold text-ink mb-2">
          Boîte à souvenirs 📦
        </h1>
        <p className="font-manrope text-ink-soft text-sm mb-6">
          Les moments précieux de notre famille, pour toujours.
        </p>
        <MurSouvenirs
          souvenirs={(souvenirRes.data ?? []) as unknown as Souvenir[]}
          creations={(creationsRes.data ?? []) as unknown as Creation[]}
          currentUserId={user.id}
          isPapa={user.email === PAPA_EMAIL}
        />
      </main>
    </>
  )
}
```

- [ ] **Step 3 : Tester dans le navigateur**

```bash
npm run dev
```
- Naviguer vers http://localhost:3000/memoire
- Vérifier : page s'affiche, bouton "Ajouter" présent, filtres présents
- Cliquer "Ajouter" → modal s'ouvre
- Ajouter un souvenir texte → apparaît dans le mur
- Cliquer le polaroïd → modal de détail s'ouvre
- Vérifier la rotation légère des polaroïds

- [ ] **Step 4 : Commit**

```bash
git add src/components/memoire/MurSouvenirs.tsx src/app/memoire/page.tsx
git commit -m "feat(etape12): page /memoire avec mur de polaroïds"
```

---

## Task 9 : MembreCard + MembreDetail + AjouterAnecdote

**Files:**
- Create: `src/components/famille/MembreCard.tsx`
- Create: `src/components/famille/MembreDetail.tsx`
- Create: `src/components/famille/AjouterAnecdote.tsx`

- [ ] **Step 1 : Créer `src/components/famille/MembreCard.tsx`**

```typescript
'use client'

import type { MembreFamille } from '@/types/famille'

interface MembreCardProps {
  membre: MembreFamille
  onClick: () => void
}

const EMOJI_DEFAUT: Record<string, string> = {
  'grand-père': '👴', 'grand-mère': '👵',
  'père': '👨', 'mère': '👩',
  'oncle': '👨', 'tante': '👩',
  'cousin': '👦', 'cousine': '👧',
  'frère': '👦', 'sœur': '👧',
}

function emojiRelation(relation: string): string {
  const key = Object.keys(EMOJI_DEFAUT).find(k => relation.toLowerCase().includes(k))
  return key ? EMOJI_DEFAUT[key] : '👤'
}

export default function MembreCard({ membre, onClick }: MembreCardProps) {
  return (
    <button
      onClick={onClick}
      className="bg-jasmine border border-sand-warm rounded-2xl p-4 text-center hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-terracotta w-full"
      aria-label={`${membre.surnom ?? membre.prenom} — ${membre.relation}`}
    >
      {membre.photo_url ? (
        <img
          src={membre.photo_url}
          alt={membre.prenom}
          className="w-16 h-16 rounded-full object-cover mx-auto mb-2"
          loading="lazy"
        />
      ) : (
        <div className="w-16 h-16 rounded-full bg-sand flex items-center justify-content-center mx-auto mb-2 text-3xl flex items-center justify-center">
          {emojiRelation(membre.relation)}
        </div>
      )}
      <p className="font-fraunces font-bold text-ink text-sm leading-tight">
        {membre.surnom ?? membre.prenom}
      </p>
      {membre.surnom && (
        <p className="font-manrope text-xs text-ink-soft">{membre.prenom} {membre.nom ?? ''}</p>
      )}
      <p className="font-manrope text-xs text-terracotta mt-1">{membre.relation}</p>
      {membre.lieu_naissance && (
        <p className="font-manrope text-xs text-ink-soft mt-0.5">📍 {membre.lieu_naissance}</p>
      )}
    </button>
  )
}
```

- [ ] **Step 2 : Créer `src/components/famille/AjouterAnecdote.tsx`**

```typescript
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ajouterAnecdote } from '@/app/actions/famille'

interface AjouterAnecdoteProps {
  membreId: string
}

export default function AjouterAnecdote({ membreId }: AjouterAnecdoteProps) {
  const [contenu, setContenu] = useState('')
  const [isPending, startTransition] = useTransition()
  const [erreur, setErreur] = useState<string | null>(null)
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!contenu.trim()) return
    setErreur(null)
    startTransition(async () => {
      try {
        await ajouterAnecdote(membreId, contenu)
        setContenu('')
        router.refresh() // re-fetch données serveur → anecdote apparaît dans le modal
      } catch (err) {
        setErreur(err instanceof Error ? err.message : 'Erreur inconnue')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3">
      <textarea
        value={contenu}
        onChange={e => setContenu(e.target.value)}
        placeholder="Ajouter une anecdote ou un souvenir sur ce membre..."
        rows={2}
        className="w-full border border-sand-warm rounded-lg px-3 py-2 font-manrope text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-terracotta resize-none"
      />
      {erreur && <p className="font-manrope text-xs text-red-600 mt-1">{erreur}</p>}
      <button
        type="submit"
        disabled={isPending || !contenu.trim()}
        className="mt-2 bg-terracotta text-white px-4 py-1.5 rounded-xl font-manrope text-sm font-semibold hover:bg-terracotta-deep disabled:opacity-50 transition-colors"
      >
        {isPending ? 'Ajout...' : 'Ajouter'}
      </button>
    </form>
  )
}
```

- [ ] **Step 3 : Créer `src/components/famille/MembreDetail.tsx`**

```typescript
'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { MembreFamille, Anecdote } from '@/types/famille'
import { supprimerAnecdote, supprimerMembre } from '@/app/actions/famille'
import { avatarFromEmail } from '@/lib/avatar'
import AjouterAnecdote from './AjouterAnecdote'

interface MembreDetailProps {
  membre: MembreFamille
  anecdotes: Anecdote[]
  currentUserId: string
  isPapa: boolean
  onClose: () => void
}

const PAPA_ID = 'b6025d5f-77d5-4208-b489-bcc717ebc01c'

export default function MembreDetail({ membre, anecdotes, currentUserId, isPapa, onClose }: MembreDetailProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSupprimerMembre() {
    if (!confirm(`Supprimer ${membre.prenom} de l'arbre ?`)) return
    startTransition(async () => {
      await supprimerMembre(membre.id)
      onClose()
    })
  }

  function handleSupprimerAnecdote(id: string) {
    startTransition(async () => {
      await supprimerAnecdote(id)
      router.refresh()
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-jasmine rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {membre.photo_url && (
              <img src={membre.photo_url} alt={membre.prenom} className="w-14 h-14 rounded-full object-cover" />
            )}
            <div>
              <h2 className="font-fraunces text-xl font-bold text-ink">
                {membre.surnom ?? membre.prenom}
              </h2>
              {membre.surnom && (
                <p className="font-manrope text-sm text-ink-soft">{membre.prenom} {membre.nom ?? ''}</p>
              )}
              <p className="font-manrope text-sm text-terracotta">{membre.relation}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-ink-soft hover:text-ink text-2xl leading-none" aria-label="Fermer">×</button>
        </div>

        {/* Infos */}
        <div className="grid grid-cols-2 gap-2 mb-4 text-sm font-manrope">
          {membre.date_naissance && (
            <div><span className="text-ink-soft">Né(e) le : </span><span className="text-ink">{new Date(membre.date_naissance).toLocaleDateString('fr-FR', { dateStyle: 'long' })}</span></div>
          )}
          {membre.lieu_naissance && (
            <div><span className="text-ink-soft">À : </span><span className="text-ink">{membre.lieu_naissance}</span></div>
          )}
        </div>

        {membre.bio && (
          <p className="font-manrope text-sm text-ink leading-relaxed mb-4 bg-sand rounded-xl p-3 whitespace-pre-wrap">{membre.bio}</p>
        )}

        {/* Anecdotes */}
        <div className="border-t border-sand-warm pt-4">
          <h3 className="font-fraunces text-base font-bold text-ink mb-3">Anecdotes & souvenirs</h3>
          {anecdotes.length === 0 ? (
            <p className="font-manrope text-sm text-ink-soft italic">Pas encore d'anecdotes. Sois le premier !</p>
          ) : (
            <div className="space-y-2 mb-3">
              {anecdotes.map(a => {
                const auteur = avatarFromEmail(a.profiles?.email ?? '')
                const peutSupprimer = isPapa || currentUserId === a.user_id
                return (
                  <div key={a.id} className="bg-white rounded-xl p-3 text-sm">
                    <p className="font-manrope text-ink">{a.contenu}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-manrope text-xs text-ink-soft">— {a.profiles?.nom ?? auteur.nom}</span>
                      {peutSupprimer && (
                        <button
                          onClick={() => handleSupprimerAnecdote(a.id)}
                          disabled={isPending}
                          className="font-manrope text-xs text-terracotta hover:underline disabled:opacity-50"
                        >
                          Supprimer
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <AjouterAnecdote membreId={membre.id} />
        </div>

        {/* Supprimer membre (Papa only) */}
        {isPapa && (
          <div className="mt-4 pt-4 border-t border-sand-warm">
            <button
              onClick={handleSupprimerMembre}
              disabled={isPending}
              className="font-manrope text-sm text-terracotta hover:underline disabled:opacity-50"
            >
              Supprimer ce membre de l'arbre
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4 : Vérifier la compilation**

```bash
npx tsc --noEmit
```
Attendu : aucune erreur.

- [ ] **Step 5 : Commit**

```bash
git add src/components/famille/MembreCard.tsx src/components/famille/MembreDetail.tsx src/components/famille/AjouterAnecdote.tsx
git commit -m "feat(etape12): composants MembreCard, MembreDetail, AjouterAnecdote"
```

---

## Task 10 : AjouterMembre

**Files:**
- Create: `src/components/famille/AjouterMembre.tsx`

- [ ] **Step 1 : Créer `src/components/famille/AjouterMembre.tsx`**

```typescript
'use client'

import { useState, useTransition } from 'react'
import { uploadPhotoMembre, ajouterMembre } from '@/app/actions/famille'

interface AjouterMembreProps {
  onClose: () => void
}

export default function AjouterMembre({ onClose }: AjouterMembreProps) {
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [surnom, setSurnom] = useState('')
  const [relation, setRelation] = useState('')
  const [cote, setCote] = useState<'khedhiri' | 'maternel'>('khedhiri')
  const [generation, setGeneration] = useState(1)
  const [dateNaissance, setDateNaissance] = useState('')
  const [lieuNaissance, setLieuNaissance] = useState('')
  const [bio, setBio] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [isPending, startTransition] = useTransition()
  const [erreur, setErreur] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!prenom.trim()) { setErreur('Le prénom est obligatoire.'); return }
    if (!relation.trim()) { setErreur('La relation est obligatoire.'); return }
    setErreur(null)

    startTransition(async () => {
      try {
        let photoUrl: string | undefined
        if (photoFile) {
          const fd = new FormData(); fd.append('file', photoFile)
          photoUrl = await uploadPhotoMembre(fd)
        }
        await ajouterMembre({
          prenom, nom: nom || undefined, surnom: surnom || undefined,
          photoUrl, dateNaissance: dateNaissance || undefined,
          lieuNaissance: lieuNaissance || undefined,
          cote, relation, generation, bio: bio || undefined,
        })
        onClose()
      } catch (err) {
        setErreur(err instanceof Error ? err.message : 'Erreur inconnue')
      }
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-jasmine rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-fraunces text-xl font-bold text-ink">Ajouter un membre</h2>
          <button onClick={onClose} className="text-ink-soft hover:text-ink text-2xl" aria-label="Fermer">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-manrope text-sm font-semibold text-ink mb-1" htmlFor="prenom">Prénom *</label>
              <input id="prenom" type="text" value={prenom} onChange={e => setPrenom(e.target.value)}
                className="w-full border border-sand-warm rounded-lg px-3 py-2 font-manrope text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-terracotta" required />
            </div>
            <div>
              <label className="block font-manrope text-sm font-semibold text-ink mb-1" htmlFor="nom">Nom</label>
              <input id="nom" type="text" value={nom} onChange={e => setNom(e.target.value)}
                className="w-full border border-sand-warm rounded-lg px-3 py-2 font-manrope text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-terracotta" />
            </div>
          </div>

          <div>
            <label className="block font-manrope text-sm font-semibold text-ink mb-1" htmlFor="surnom">Surnom (ex: "Jid Ahmed", "Tata Fatma")</label>
            <input id="surnom" type="text" value={surnom} onChange={e => setSurnom(e.target.value)}
              className="w-full border border-sand-warm rounded-lg px-3 py-2 font-manrope text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-terracotta" />
          </div>

          <div>
            <label className="block font-manrope text-sm font-semibold text-ink mb-1" htmlFor="relation">Relation *</label>
            <input id="relation" type="text" value={relation} onChange={e => setRelation(e.target.value)}
              placeholder="Ex: Grand-père paternel, Tante maternelle..."
              className="w-full border border-sand-warm rounded-lg px-3 py-2 font-manrope text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-terracotta" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-manrope text-sm font-semibold text-ink mb-1" htmlFor="cote">Côté</label>
              <select id="cote" value={cote} onChange={e => setCote(e.target.value as 'khedhiri' | 'maternel')}
                className="w-full border border-sand-warm rounded-lg px-3 py-2 font-manrope text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-terracotta">
                <option value="khedhiri">Côté Papa (Khedhiri)</option>
                <option value="maternel">Côté Maternel</option>
              </select>
            </div>
            <div>
              <label className="block font-manrope text-sm font-semibold text-ink mb-1" htmlFor="generation">Génération</label>
              <select id="generation" value={generation} onChange={e => setGeneration(Number(e.target.value))}
                className="w-full border border-sand-warm rounded-lg px-3 py-2 font-manrope text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-terracotta">
                <option value={0}>Arrière-grands-parents</option>
                <option value={1}>Grands-parents</option>
                <option value={2}>Parents / Oncles / Tantes</option>
                <option value={3}>Nous (Sandra, Sarah, Papa)</option>
                <option value={4}>Cousins / Cousines</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-manrope text-sm font-semibold text-ink mb-1" htmlFor="date-naissance">Date de naissance</label>
              <input id="date-naissance" type="date" value={dateNaissance} onChange={e => setDateNaissance(e.target.value)}
                className="w-full border border-sand-warm rounded-lg px-3 py-2 font-manrope text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-terracotta" />
            </div>
            <div>
              <label className="block font-manrope text-sm font-semibold text-ink mb-1" htmlFor="lieu">Lieu de naissance</label>
              <input id="lieu" type="text" value={lieuNaissance} onChange={e => setLieuNaissance(e.target.value)}
                placeholder="Ex: Tunis, Lisbonne..."
                className="w-full border border-sand-warm rounded-lg px-3 py-2 font-manrope text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-terracotta" />
            </div>
          </div>

          <div>
            <label className="block font-manrope text-sm font-semibold text-ink mb-1" htmlFor="bio">Bio / Histoire</label>
            <textarea id="bio" value={bio} onChange={e => setBio(e.target.value)} rows={3}
              placeholder="Quelques mots sur cette personne..."
              className="w-full border border-sand-warm rounded-lg px-3 py-2 font-manrope text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-terracotta resize-none" />
          </div>

          <div>
            <label className="block font-manrope text-sm font-semibold text-ink mb-1" htmlFor="photo-membre">Photo (optionnel)</label>
            <input id="photo-membre" type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files?.[0] ?? null)}
              className="w-full font-manrope text-sm text-ink" />
          </div>

          {erreur && <p className="font-manrope text-sm text-red-600">{erreur}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 rounded-xl border border-sand-warm font-manrope text-sm text-ink-soft hover:bg-sand transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={isPending}
              className="flex-1 py-2 rounded-xl bg-terracotta text-white font-manrope text-sm font-semibold hover:bg-terracotta-deep transition-colors disabled:opacity-50">
              {isPending ? 'Ajout...' : 'Ajouter 🌳'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2 : Vérifier la compilation**

```bash
npx tsc --noEmit
```
Attendu : aucune erreur.

- [ ] **Step 3 : Commit**

```bash
git add src/components/famille/AjouterMembre.tsx
git commit -m "feat(etape12): modal AjouterMembre"
```

---

## Task 11 : ArbreGenealogique + page `/famille`

**Files:**
- Create: `src/components/famille/ArbreGenealogique.tsx`
- Create: `src/app/famille/page.tsx`

- [ ] **Step 1 : Créer `src/components/famille/ArbreGenealogique.tsx`**

```typescript
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

  // Grouper par génération
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
```

- [ ] **Step 2 : Créer `src/app/famille/page.tsx`**

```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NavBar from '@/components/NavBar'
import ArbreGenealogique from '@/components/famille/ArbreGenealogique'
import type { MembreFamille, Anecdote } from '@/types/famille'

const PAPA_EMAIL = 'houssem@khedhiri.me'

export default async function FamillePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [membresRes, anecdotesRes] = await Promise.all([
    supabase
      .from('famille_membres')
      .select('id, prenom, nom, surnom, photo_url, date_naissance, lieu_naissance, cote, relation, generation, bio, created_by, created_at')
      .order('generation', { ascending: true })
      .order('prenom', { ascending: true }),
    supabase
      .from('famille_anecdotes')
      .select('id, membre_id, user_id, contenu, created_at, profiles(email, nom, avatar_url, couleur)')
      .order('created_at', { ascending: true }),
  ])

  return (
    <>
      <NavBar />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="font-fraunces text-2xl font-bold text-ink mb-2">
          Notre famille 🌳
        </h1>
        <p className="font-manrope text-ink-soft text-sm mb-6">
          Nos racines des deux côtés de la Méditerranée.
        </p>
        <ArbreGenealogique
          membres={(membresRes.data ?? []) as unknown as MembreFamille[]}
          anecdotes={(anecdotesRes.data ?? []) as unknown as Anecdote[]}
          currentUserId={user.id}
          isPapa={user.email === PAPA_EMAIL}
        />
      </main>
    </>
  )
}
```

- [ ] **Step 3 : Tester dans le navigateur**

```bash
npm run dev
```
- Naviguer vers http://localhost:3000/famille
- Vérifier : page s'affiche avec les deux onglets Khedhiri / Maternel
- Cliquer "Ajouter un membre" → modal s'ouvre avec le formulaire complet
- Ajouter un grand-père → carte apparaît dans la bonne génération
- Cliquer la carte → modal de détail s'ouvre
- Ajouter une anecdote → s'affiche immédiatement dans le modal
- Vérifier la page `/memoire` : la NavBar affiche bien les deux nouveaux liens

- [ ] **Step 4 : Commit final**

```bash
git add src/components/famille/ArbreGenealogique.tsx src/app/famille/page.tsx
git commit -m "feat(etape12): page /famille avec arbre généalogique"
```

- [ ] **Step 5 : Push vers GitHub**

```bash
git push
```
Vercel déploie automatiquement depuis la branche main.
