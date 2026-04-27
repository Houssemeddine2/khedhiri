# Étape 3 — Timeline Familiale Temps Réel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construire la timeline familiale partagée : publication de textes, photos et messages vocaux avec réactions emoji, visible en temps réel par les 3 membres.

**Architecture:** Supabase `posts` + `reactions` + `profiles` tables (RLS: tout le monde lit et écrit), Supabase Realtime pour les mises à jour live (refetch sur chaque événement), Supabase Storage bucket `media` (public) pour photos et audio. Server Actions Next.js pour les mutations, composant client `Timeline` pour l'état et le realtime.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind v4, @supabase/ssr, @supabase/supabase-js, MediaRecorder API (vocaux), HTML audio element (lecture)

---

## Structure des fichiers

| Fichier | Action | Rôle |
|---------|--------|------|
| `supabase/etape3-schema.sql` | Créer | SQL à coller dans le dashboard Supabase une fois |
| `src/types/post.ts` | Créer | Types TypeScript Post, Reaction, CurrentUser |
| `src/lib/avatar.ts` | Créer | Couleur avatar + initiale + temps relatif |
| `src/app/actions/posts.ts` | Créer | Server Actions : createTextPost, uploadMedia, createMediaPost, toggleReaction, deletePost |
| `src/components/timeline/VoicePlayer.tsx` | Créer | Lecture audio avec bouton play/pause |
| `src/components/timeline/ReactionBar.tsx` | Créer | Boutons réaction ❤️ 🤗 😊 🎉 |
| `src/components/timeline/PostCard.tsx` | Créer | Carte d'un post (texte / photo / audio) |
| `src/components/timeline/VoiceRecorder.tsx` | Créer | Enregistrement vocal → upload → post |
| `src/components/timeline/ComposeBar.tsx` | Créer | Zone de composition (texte + photo + voix) |
| `src/components/timeline/Timeline.tsx` | Créer | Composant client principal, realtime, liste de posts |
| `src/app/page.tsx` | Modifier | Authentification + rendu de Timeline |

---

### Task 1 : Schéma Supabase

**Files:**
- Create: `supabase/etape3-schema.sql`

- [ ] **Step 1 : Créer le fichier SQL de référence**

```sql
-- supabase/etape3-schema.sql
-- À copier-coller dans : Supabase Dashboard → SQL Editor → New query

-- ─── TABLES ─────────────────────────────────────────────────────────────────

create table profiles (
  id   uuid primary key references auth.users on delete cascade,
  email text unique not null,
  nom   text not null,
  created_at timestamptz default now()
);

create table posts (
  id             uuid primary key default gen_random_uuid(),
  author_id      uuid references auth.users on delete cascade not null,
  type           text not null check (type in ('text', 'photo', 'audio')),
  content        text,
  media_url      text,
  audio_duration integer,
  created_at     timestamptz default now() not null
);

create table reactions (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid references posts on delete cascade not null,
  user_id    uuid references auth.users on delete cascade not null,
  emoji      text not null,
  created_at timestamptz default now() not null,
  unique (post_id, user_id)
);

-- ─── ROW LEVEL SECURITY ─────────────────────────────────────────────────────

alter table profiles  enable row level security;
alter table posts     enable row level security;
alter table reactions enable row level security;

-- Profiles : lecture publique (pour les 3 membres), pas d'écriture via client
create policy "Famille peut lire profils"    on profiles  for select to authenticated using (true);
create policy "Famille peut lire posts"      on posts     for select to authenticated using (true);
create policy "Famille peut créer posts"     on posts     for insert to authenticated with check (auth.uid() = author_id);
create policy "Auteur peut supprimer post"   on posts     for delete to authenticated using (auth.uid() = author_id);
create policy "Famille peut lire réactions"  on reactions for select to authenticated using (true);
create policy "Famille peut réagir"          on reactions for insert to authenticated with check (auth.uid() = user_id);
create policy "Auteur peut changer réaction" on reactions for update to authenticated using (auth.uid() = user_id);
create policy "Auteur peut retirer réaction" on reactions for delete to authenticated using (auth.uid() = user_id);

-- ─── PROFILS DES 3 MEMBRES ───────────────────────────────────────────────────

-- ⚠ Adapter les UUID si le projet Supabase est recréé (vérifier dans Auth → Users)
insert into profiles (id, email, nom) values
  ('b6025d5f-77d5-4208-b489-bcc717ebc01c', 'houssem@khedhiri.me', 'Houssem'),
  ('1a0967e9-91e0-48f6-a3da-752255274153', 'sandra@khedhiri.me',  'Sandra'),
  ('617eff77-47ed-40e0-b784-c027183c9bee', 'sarah@khedhiri.me',   'Sarah')
on conflict (id) do nothing;

-- ─── REALTIME ────────────────────────────────────────────────────────────────

alter publication supabase_realtime add table posts;
alter publication supabase_realtime add table reactions;

-- ─── STORAGE ─────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  52428800,
  array['image/jpeg','image/png','image/webp','image/gif','image/heic',
        'audio/webm','audio/mp4','audio/ogg','audio/mpeg']
) on conflict (id) do nothing;

create policy "Famille peut uploader" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media');

create policy "Public peut lire media" on storage.objects
  for select using (bucket_id = 'media');

create policy "Auteur peut supprimer media" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and auth.uid()::text = (storage.foldername(name))[1]);
```

- [ ] **Step 2 : Exécuter le SQL dans Supabase**

  1. Aller sur https://supabase.com/dashboard/project/zopovxazxkavqqjxlpul/sql/new
  2. Coller le contenu de `supabase/etape3-schema.sql`
  3. Cliquer **Run**
  4. Vérifier : aucune erreur en rouge
  5. Vérifier dans **Table Editor** que les tables `profiles`, `posts`, `reactions` existent
  6. Vérifier dans **Storage** que le bucket `media` existe

- [ ] **Step 3 : Commit**

```bash
git add supabase/etape3-schema.sql
git commit -m "feat: schéma Supabase étape 3 (posts, réactions, profils, storage)"
```

---

### Task 2 : Types TypeScript

**Files:**
- Create: `src/types/post.ts`

- [ ] **Step 1 : Créer le fichier de types**

```typescript
// src/types/post.ts

export type Reaction = {
  id: string
  post_id: string
  user_id: string
  emoji: string
  created_at: string
}

export type PostProfile = {
  email: string
  nom: string
}

export type Post = {
  id: string
  author_id: string
  type: 'text' | 'photo' | 'audio'
  content: string | null
  media_url: string | null
  audio_duration: number | null
  created_at: string
  reactions: Reaction[]
  profiles: PostProfile | null
}

export type CurrentUser = {
  id: string
  email: string
}
```

- [ ] **Step 2 : Vérifier la compilation TypeScript**

```bash
npx tsc --noEmit
```

Résultat attendu : aucune erreur.

- [ ] **Step 3 : Commit**

```bash
git add src/types/post.ts
git commit -m "feat: types TypeScript pour posts et réactions"
```

---

### Task 3 : Utilitaire avatar

**Files:**
- Create: `src/lib/avatar.ts`

- [ ] **Step 1 : Créer l'utilitaire**

```typescript
// src/lib/avatar.ts

type AvatarInfo = {
  initiale: string
  couleurBg: string
  nom: string
}

const COULEURS: Record<string, string> = {
  houssem: 'bg-azur',
  sandra:  'bg-terracotta',
  sarah:   'bg-olive',
}

export function avatarFromEmail(email: string): AvatarInfo {
  const prenom = email.split('@')[0].toLowerCase()
  const nom    = prenom.charAt(0).toUpperCase() + prenom.slice(1)
  return {
    initiale:  nom.charAt(0),
    couleurBg: COULEURS[prenom] ?? 'bg-gold',
    nom,
  }
}

export function tempsRelatif(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min  = Math.floor(diff / 60_000)
  if (min < 1)  return 'à l\'instant'
  if (min < 60) return `il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24)   return `il y a ${h}h`
  const j = Math.floor(h / 24)
  return j === 1 ? 'hier' : `il y a ${j} jours`
}

export function formatDuree(secondes: number): string {
  const m   = Math.floor(secondes / 60)
  const sec = Math.floor(secondes % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}
```

- [ ] **Step 2 : Vérifier la compilation TypeScript**

```bash
npx tsc --noEmit
```

Résultat attendu : aucune erreur.

- [ ] **Step 3 : Commit**

```bash
git add src/lib/avatar.ts
git commit -m "feat: utilitaire avatar (couleur, initiale, temps relatif)"
```

---

### Task 4 : Actions serveur

**Files:**
- Create: `src/app/actions/posts.ts`

- [ ] **Step 1 : Créer le fichier d'actions**

```typescript
// src/app/actions/posts.ts
'use server'

import { createClient } from '@/lib/supabase/server'

export async function createTextPost(content: string): Promise<void> {
  if (!content.trim()) return
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { error } = await supabase.from('posts').insert({
    author_id: user.id,
    type: 'text',
    content: content.trim(),
  })
  if (error) throw new Error(error.message)
}

export async function uploadMedia(formData: FormData): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const file = formData.get('file') as File | null
  if (!file) throw new Error('Fichier manquant')

  const ext  = file.name.split('.').pop() ?? 'bin'
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage.from('media').upload(path, file)
  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from('media').getPublicUrl(path)
  return data.publicUrl
}

export async function createMediaPost(
  type: 'photo' | 'audio',
  mediaUrl: string,
  audioDuration?: number,
): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { error } = await supabase.from('posts').insert({
    author_id:      user.id,
    type,
    media_url:      mediaUrl,
    audio_duration: audioDuration ?? null,
  })
  if (error) throw new Error(error.message)
}

export async function toggleReaction(postId: string, emoji: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data: existing } = await supabase
    .from('reactions')
    .select('id, emoji')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    if (existing.emoji === emoji) {
      await supabase.from('reactions').delete().eq('id', existing.id)
    } else {
      await supabase.from('reactions').update({ emoji }).eq('id', existing.id)
    }
  } else {
    await supabase.from('reactions').insert({ post_id: postId, user_id: user.id, emoji })
  }
}

export async function deletePost(postId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)
    .eq('author_id', user.id)
  if (error) throw new Error(error.message)
}
```

- [ ] **Step 2 : Vérifier la compilation TypeScript**

```bash
npx tsc --noEmit
```

Résultat attendu : aucune erreur.

- [ ] **Step 3 : Commit**

```bash
git add src/app/actions/posts.ts
git commit -m "feat: server actions pour posts, upload media et réactions"
```

---

### Task 5 : Composant VoicePlayer

**Files:**
- Create: `src/components/timeline/VoicePlayer.tsx`

- [ ] **Step 1 : Créer le composant**

```tsx
// src/components/timeline/VoicePlayer.tsx
'use client'

import { useRef, useState } from 'react'
import { formatDuree } from '@/lib/avatar'

type Props = {
  url: string
  duration: number | null
}

export function VoicePlayer({ url, duration }: Props) {
  const audioRef  = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying]     = useState(false)
  const [elapsed, setElapsed]     = useState(0)

  function toggle() {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      audio.play()
      setPlaying(true)
    }
  }

  return (
    <div className="bg-sand rounded-2xl p-3 flex items-center gap-3">
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={e => setElapsed(e.currentTarget.currentTime)}
        onEnded={() => { setPlaying(false); setElapsed(0) }}
      />

      <button
        onClick={toggle}
        className="w-10 h-10 rounded-full bg-terracotta text-white flex items-center justify-center flex-shrink-0 hover:bg-terracotta-deep transition-colors"
        aria-label={playing ? 'Pause' : 'Lire le message vocal'}
      >
        {playing ? '⏸' : '▶'}
      </button>

      {/* Fausses barres de forme d'onde */}
      <div className="flex-1 flex items-center gap-px h-7" aria-hidden>
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-terracotta rounded-sm opacity-50"
            style={{ height: `${14 + Math.abs(Math.sin(i * 0.7) * 12)}px` }}
          />
        ))}
      </div>

      <span className="text-xs text-ink-soft font-manrope w-8 text-right flex-shrink-0">
        {playing ? formatDuree(elapsed) : formatDuree(duration ?? 0)}
      </span>
    </div>
  )
}
```

- [ ] **Step 2 : Vérifier la compilation TypeScript**

```bash
npx tsc --noEmit
```

Résultat attendu : aucune erreur.

- [ ] **Step 3 : Commit**

```bash
git add src/components/timeline/VoicePlayer.tsx
git commit -m "feat: composant VoicePlayer (lecture audio avec barres d'onde)"
```

---

### Task 6 : Composant ReactionBar

**Files:**
- Create: `src/components/timeline/ReactionBar.tsx`

- [ ] **Step 1 : Créer le composant**

```tsx
// src/components/timeline/ReactionBar.tsx
'use client'

import { useTransition } from 'react'
import { toggleReaction } from '@/app/actions/posts'
import type { Reaction } from '@/types/post'

const EMOJIS = ['❤️', '🤗', '😊', '🎉'] as const

type Props = {
  postId: string
  reactions: Reaction[]
  currentUserId: string
}

export function ReactionBar({ postId, reactions, currentUserId }: Props) {
  const [isPending, startTransition] = useTransition()

  const myReaction = reactions.find(r => r.user_id === currentUserId)

  function handleClick(emoji: string) {
    startTransition(() => { toggleReaction(postId, emoji) })
  }

  return (
    <div className="flex gap-2 flex-wrap" role="group" aria-label="Réactions">
      {EMOJIS.map(emoji => {
        const count  = reactions.filter(r => r.emoji === emoji).length
        const active = myReaction?.emoji === emoji

        return (
          <button
            key={emoji}
            onClick={() => handleClick(emoji)}
            disabled={isPending}
            aria-pressed={active}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-all disabled:opacity-50
              ${active
                ? 'bg-terracotta border-terracotta text-white'
                : 'border-terracotta/20 text-ink-soft hover:border-terracotta hover:text-terracotta'
              }`}
          >
            <span>{emoji}</span>
            {count > 0 && (
              <span className="text-xs font-medium font-manrope">{count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2 : Vérifier la compilation TypeScript**

```bash
npx tsc --noEmit
```

Résultat attendu : aucune erreur.

- [ ] **Step 3 : Commit**

```bash
git add src/components/timeline/ReactionBar.tsx
git commit -m "feat: composant ReactionBar (réactions emoji ❤️ 🤗 😊 🎉)"
```

---

### Task 7 : Composant PostCard

**Files:**
- Create: `src/components/timeline/PostCard.tsx`

- [ ] **Step 1 : Créer le composant**

```tsx
// src/components/timeline/PostCard.tsx
'use client'

import { useTransition } from 'react'
import { avatarFromEmail, tempsRelatif } from '@/lib/avatar'
import { deletePost } from '@/app/actions/posts'
import { VoicePlayer } from './VoicePlayer'
import { ReactionBar } from './ReactionBar'
import type { Post } from '@/types/post'

type Props = {
  post: Post
  currentUserId: string
}

export function PostCard({ post, currentUserId }: Props) {
  const [isPending, startTransition] = useTransition()

  const authorEmail  = post.profiles?.email ?? ''
  const authorNom    = post.profiles?.nom ?? authorEmail.split('@')[0]
  const { initiale, couleurBg } = avatarFromEmail(authorEmail)
  const isAuthor     = post.author_id === currentUserId

  function handleDelete() {
    if (!confirm('Supprimer ce post ?')) return
    startTransition(() => { deletePost(post.id) })
  }

  return (
    <article
      className={`bg-jasmine rounded-2xl p-5 border border-terracotta/8 shadow-sm transition-opacity ${isPending ? 'opacity-50' : ''}`}
    >
      <header className="flex items-center gap-3 mb-4">
        <div
          className={`w-11 h-11 rounded-full ${couleurBg} flex items-center justify-center text-white font-fraunces font-semibold text-lg flex-shrink-0`}
          aria-hidden
        >
          {initiale}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-fraunces font-semibold text-ink">{authorNom}</p>
          <p className="text-xs text-ink-soft">{tempsRelatif(post.created_at)}</p>
        </div>
        {isAuthor && (
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="text-ink-soft hover:text-terracotta transition-colors text-sm px-2 py-1 rounded-lg disabled:opacity-40"
            aria-label="Supprimer ce post"
          >
            ✕
          </button>
        )}
      </header>

      {post.type === 'text' && post.content && (
        <p className="text-ink leading-relaxed mb-4 whitespace-pre-wrap">{post.content}</p>
      )}

      {post.type === 'photo' && post.media_url && (
        <img
          src={post.media_url}
          alt={`Photo de ${authorNom}`}
          className="w-full rounded-xl mb-4 max-h-96 object-cover"
          loading="lazy"
        />
      )}

      {post.type === 'audio' && post.media_url && (
        <div className="mb-4">
          <VoicePlayer url={post.media_url} duration={post.audio_duration} />
        </div>
      )}

      <ReactionBar
        postId={post.id}
        reactions={post.reactions}
        currentUserId={currentUserId}
      />
    </article>
  )
}
```

- [ ] **Step 2 : Vérifier la compilation TypeScript**

```bash
npx tsc --noEmit
```

Résultat attendu : aucune erreur.

- [ ] **Step 3 : Commit**

```bash
git add src/components/timeline/PostCard.tsx
git commit -m "feat: composant PostCard (texte, photo, audio + réactions)"
```

---

### Task 8 : Composant VoiceRecorder

**Files:**
- Create: `src/components/timeline/VoiceRecorder.tsx`

- [ ] **Step 1 : Créer le composant**

```tsx
// src/components/timeline/VoiceRecorder.tsx
'use client'

import { useRef, useState } from 'react'
import { uploadMedia, createMediaPost } from '@/app/actions/posts'
import { formatDuree } from '@/lib/avatar'

type Props = {
  onDone: () => void
  onCancel: () => void
}

export function VoiceRecorder({ onDone, onCancel }: Props) {
  const [recording,  setRecording]  = useState(false)
  const [secondes,   setSecondes]   = useState(0)
  const [uploading,  setUploading]  = useState(false)
  const [erreur,     setErreur]     = useState<string | null>(null)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef   = useRef<Blob[]>([])
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null)
  const durationRef = useRef(0)

  async function startRecording() {
    setErreur(null)
    try {
      const stream   = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      const recorder = new MediaRecorder(stream, { mimeType })

      chunksRef.current = []
      recorder.ondataavailable = e => chunksRef.current.push(e.data)
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: mimeType })
        const ext  = mimeType.includes('webm') ? 'webm' : 'mp4'
        const file = new File([blob], `vocal.${ext}`, { type: mimeType })
        const fd   = new FormData()
        fd.append('file', file)

        setUploading(true)
        try {
          const url = await uploadMedia(fd)
          await createMediaPost('audio', url, durationRef.current)
          onDone()
        } catch (e) {
          setErreur('Erreur lors de l\'envoi. Réessaie.')
          setUploading(false)
        }
      }

      recorder.start()
      recorderRef.current = recorder
      setRecording(true)
      durationRef.current = 0
      timerRef.current = setInterval(() => {
        durationRef.current += 1
        setSecondes(s => s + 1)
      }, 1000)
    } catch {
      setErreur('Microphone inaccessible. Vérifie les permissions.')
    }
  }

  function stopAndSend() {
    if (timerRef.current) clearInterval(timerRef.current)
    recorderRef.current?.stop()
    setRecording(false)
  }

  function cancel() {
    if (timerRef.current) clearInterval(timerRef.current)
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.ondataavailable = null
      recorderRef.current.onstop          = null
      recorderRef.current.stop()
    }
    setRecording(false)
    setSecondes(0)
    onCancel()
  }

  if (uploading) {
    return (
      <div className="flex items-center gap-2 text-ink-soft font-manrope text-sm py-2">
        <span className="animate-pulse">⏳</span> Envoi en cours…
      </div>
    )
  }

  if (erreur) {
    return (
      <div className="flex items-center gap-3">
        <p className="text-sm text-red-500 font-manrope">{erreur}</p>
        <button onClick={cancel} className="text-ink-soft text-sm underline">Annuler</button>
      </div>
    )
  }

  if (recording) {
    return (
      <div className="flex items-center gap-3">
        <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse flex-shrink-0" aria-label="Enregistrement en cours" />
        <span className="font-manrope text-sm text-ink-soft tabular-nums">{formatDuree(secondes)}</span>
        <button
          onClick={stopAndSend}
          className="bg-terracotta hover:bg-terracotta-deep text-white px-4 py-1.5 rounded-full text-sm font-manrope font-semibold transition-colors"
        >
          Envoyer
        </button>
        <button onClick={cancel} className="text-ink-soft text-sm hover:text-ink transition-colors">
          Annuler
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={startRecording}
      className="w-10 h-10 rounded-xl bg-sand flex items-center justify-center text-xl hover:bg-sand-warm transition-colors"
      aria-label="Enregistrer un message vocal"
    >
      🎤
    </button>
  )
}
```

- [ ] **Step 2 : Vérifier la compilation TypeScript**

```bash
npx tsc --noEmit
```

Résultat attendu : aucune erreur.

- [ ] **Step 3 : Commit**

```bash
git add src/components/timeline/VoiceRecorder.tsx
git commit -m "feat: composant VoiceRecorder (enregistrement vocal → Supabase Storage)"
```

---

### Task 9 : Composant ComposeBar

**Files:**
- Create: `src/components/timeline/ComposeBar.tsx`

- [ ] **Step 1 : Créer le composant**

```tsx
// src/components/timeline/ComposeBar.tsx
'use client'

import { useRef, useState, useTransition } from 'react'
import { createTextPost, uploadMedia, createMediaPost } from '@/app/actions/posts'
import { VoiceRecorder } from './VoiceRecorder'

export function ComposeBar() {
  const [texte,     setTexte]     = useState('')
  const [modeVoice, setModeVoice] = useState(false)
  const [erreur,    setErreur]    = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  function handleSubmitTexte() {
    if (!texte.trim()) return
    setErreur(null)
    startTransition(async () => {
      try {
        await createTextPost(texte)
        setTexte('')
      } catch {
        setErreur('Impossible de publier. Réessaie.')
      }
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmitTexte()
    }
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setErreur(null)
    const fd = new FormData()
    fd.append('file', file)
    startTransition(async () => {
      try {
        const url = await uploadMedia(fd)
        await createMediaPost('photo', url)
      } catch {
        setErreur('Impossible d\'envoyer la photo. Réessaie.')
      }
    })
    e.target.value = ''
  }

  if (modeVoice) {
    return (
      <div className="bg-jasmine rounded-2xl p-4 border border-terracotta/10 shadow-sm">
        <p className="font-caveat text-gold text-lg mb-3">Message vocal ♡</p>
        <VoiceRecorder
          onDone={() => setModeVoice(false)}
          onCancel={() => setModeVoice(false)}
        />
      </div>
    )
  }

  return (
    <div className="bg-jasmine rounded-2xl p-4 border border-terracotta/10 shadow-sm">
      <textarea
        value={texte}
        onChange={e => setTexte(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Partagez quelque chose… ♡"
        rows={3}
        disabled={isPending}
        className="w-full bg-transparent font-manrope text-ink placeholder:text-ink-soft placeholder:italic resize-none outline-none disabled:opacity-60"
        aria-label="Message"
      />

      {erreur && (
        <p className="text-sm text-red-500 font-manrope mt-1">{erreur}</p>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-terracotta/15">
        <div className="flex gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
            aria-label="Choisir une photo"
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={isPending}
            className="w-10 h-10 rounded-xl bg-sand flex items-center justify-center text-xl hover:bg-sand-warm transition-colors disabled:opacity-50"
            aria-label="Ajouter une photo"
          >
            📷
          </button>
          <button
            onClick={() => setModeVoice(true)}
            disabled={isPending}
            className="w-10 h-10 rounded-xl bg-sand flex items-center justify-center text-xl hover:bg-sand-warm transition-colors disabled:opacity-50"
            aria-label="Message vocal"
          >
            🎤
          </button>
        </div>

        <button
          onClick={handleSubmitTexte}
          disabled={!texte.trim() || isPending}
          className="bg-terracotta hover:bg-terracotta-deep text-white font-manrope font-semibold px-5 py-2 rounded-full transition-colors disabled:opacity-40"
        >
          {isPending ? '…' : 'Publier →'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2 : Vérifier la compilation TypeScript**

```bash
npx tsc --noEmit
```

Résultat attendu : aucune erreur.

- [ ] **Step 3 : Commit**

```bash
git add src/components/timeline/ComposeBar.tsx
git commit -m "feat: composant ComposeBar (texte + photo + bouton vocal)"
```

---

### Task 10 : Composant Timeline (temps réel)

**Files:**
- Create: `src/components/timeline/Timeline.tsx`

- [ ] **Step 1 : Créer le composant**

```tsx
// src/components/timeline/Timeline.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { avatarFromEmail } from '@/lib/avatar'
import { ComposeBar } from './ComposeBar'
import { PostCard } from './PostCard'
import type { Post, CurrentUser } from '@/types/post'

type Props = {
  currentUser: CurrentUser
}

export function Timeline({ currentUser }: Props) {
  const [posts,      setPosts]      = useState<Post[]>([])
  const [chargement, setChargement] = useState(true)
  const [connecte,   setConnecte]   = useState(false)

  const { nom } = avatarFromEmail(currentUser.email)

  useEffect(() => {
    const supabase = createClient()

    async function fetchPosts() {
      const { data } = await supabase
        .from('posts')
        .select('*, reactions(*), profiles!author_id(email, nom)')
        .order('created_at', { ascending: false })
        .limit(50)
      if (data) setPosts(data as Post[])
      setChargement(false)
    }

    fetchPosts()

    const channel = supabase
      .channel('timeline-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' },     () => fetchPosts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reactions' }, () => fetchPosts())
      .subscribe(status => setConnecte(status === 'SUBSCRIBED'))

    return () => { supabase.removeChannel(channel) }
  }, [])

  return (
    <div className="max-w-xl mx-auto px-4 py-6 pb-16">
      {/* En-tête */}
      <header className="text-center mb-8">
        <h1 className="font-fraunces italic text-4xl md:text-5xl text-terracotta">
          khedhiri.me
        </h1>
        <p className="font-caveat text-xl text-gold mt-1">
          Bonjour {nom} ♡
        </p>
        {connecte && (
          <p className="text-xs text-olive mt-2 font-manrope flex items-center justify-center gap-1">
            <span className="w-2 h-2 rounded-full bg-olive inline-block" />
            En direct
          </p>
        )}
      </header>

      {/* Zone de composition */}
      <div className="mb-6">
        <ComposeBar />
      </div>

      {/* Liste de posts */}
      <div className="flex flex-col gap-4">
        {chargement ? (
          <p className="text-center text-ink-soft font-caveat text-xl py-12">
            Chargement…
          </p>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-fraunces italic text-3xl text-terracotta mb-3">
              La timeline est vide ♡
            </p>
            <p className="font-caveat text-xl text-ink-soft">
              Soyez les premiers à partager quelque chose.
            </p>
          </div>
        ) : (
          posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUser.id}
            />
          ))
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2 : Vérifier la compilation TypeScript**

```bash
npx tsc --noEmit
```

Résultat attendu : aucune erreur.

- [ ] **Step 3 : Commit**

```bash
git add src/components/timeline/Timeline.tsx
git commit -m "feat: composant Timeline avec abonnement Supabase Realtime"
```

---

### Task 11 : Mise à jour de la page d'accueil

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1 : Remplacer le contenu de page.tsx**

```tsx
// src/app/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Timeline } from '@/components/timeline/Timeline'

export default async function AccueilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <main className="min-h-screen bg-cream">
      <Timeline currentUser={{ id: user.id, email: user.email ?? '' }} />
    </main>
  )
}
```

- [ ] **Step 2 : Vérifier la compilation complète**

```bash
npm run build
```

Résultat attendu : build réussi, aucune erreur TypeScript ni Next.js.

- [ ] **Step 3 : Tester localement**

```bash
npm run dev
```

Vérifications à faire dans le navigateur sur http://localhost:3000 :
1. Se connecter avec houssem@khedhiri.me / Khedhiri2026!
2. La timeline s'affiche : en-tête "khedhiri.me", "Bonjour Houssem ♡", zone de composition, message vide
3. Écrire un texte dans la zone → cliquer "Publier →" → le post apparaît sans recharger
4. Ouvrir un second onglet (ou navigateur) → se connecter avec sandra@khedhiri.me / Sandra2026! → le post de Houssem apparaît en temps réel
5. Sandra publie quelque chose → apparaît dans l'onglet de Houssem en temps réel
6. Cliquer sur ❤️ → la réaction se met à jour dans les deux onglets
7. Cliquer sur 📷 → choisir une image → la photo apparaît dans la timeline
8. Cliquer sur 🎤 → autoriser le microphone → enregistrer → Envoyer → le message vocal apparaît avec le lecteur
9. Cliquer ▶ sur un message vocal → l'audio se lance
10. Auteur d'un post : le bouton ✕ (supprimer) apparaît → confirm → le post disparaît
11. Autre membre : le ✕ n'apparaît pas

- [ ] **Step 4 : Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: page d'accueil → timeline familiale temps réel (étape 3 complète)"
```

---

### Task 12 : Déploiement

**Files:** aucun (push Git déclenche Vercel)

- [ ] **Step 1 : Pousser sur GitHub**

```bash
git push
```

Vercel déploie automatiquement. Attendre ~1-2 minutes.

- [ ] **Step 2 : Vérifier sur https://khedhiri.me**

  1. Connexion avec un vrai compte
  2. Publication d'un message
  3. Ouvrir sur téléphone (Sandra ou Sarah) → le message apparaît en temps réel

- [ ] **Step 3 : Mettre à jour CLAUDE.md**

Modifier la ligne `[ ] **Étape 3**` en `[x] **Étape 3**` et ajouter une ligne dans le journal des sessions.

---

## Auto-review

**Couverture spec** :
- ✅ Timeline temps réel (Supabase Realtime)
- ✅ Messages texte
- ✅ Photos
- ✅ Messages vocaux (enregistrement + lecture)
- ✅ Réactions emoji
- ✅ Identité visuelle (palette, typos)
- ✅ Mobile-first (max-w-xl, gros boutons pour Sarah)
- ✅ Accessibilité (aria-label sur tous les boutons)
- ✅ Suppression de ses propres posts

**Pas dans cette étape (YAGNI)** :
- Navigation vers autres sections (étape 4)
- Pagination (50 posts suffisent pour commencer)
- Emojis personnalisés au-delà des 4 proposés
