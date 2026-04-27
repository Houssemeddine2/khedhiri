# Chats Individuels Temps Réel — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implémenter 3 chats privés bilatéraux temps réel (Papa↔Sandra, Papa↔Sarah, Sandra↔Sarah) avec messages texte/photo/audio, accessibles via une barre de navigation persistante.

**Architecture:** Table `messages` en Supabase avec `conversation_id` = tri alphabétique des deux UUIDs séparés par `_`. RLS garantit que chaque conversation n'est lisible que par ses 2 participants. `ChatView` est un composant client avec Supabase Realtime filtré par `conversation_id`. `NavBar` est un composant serveur qui lit l'auth et affiche les 2 autres membres. `VoiceRecorder` est découplé de `createMediaPost` via un callback `onRecorded` pour le réutiliser dans le chat.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind v4, Supabase SSR + Realtime, `@supabase/ssr` `createBrowserClient`

---

## Structure des fichiers

| Fichier | Action | Responsabilité |
|---------|--------|----------------|
| `supabase/etape4-schema.sql` | Créer | Table messages, RLS, index, Realtime |
| `src/types/chat.ts` | Créer | Types Message, ChatMembre |
| `src/lib/membres.ts` | Créer | Liste fixe des 3 membres (IDs hardcodés) |
| `src/lib/conversation.ts` | Créer | Fonction `conversationId(uid1, uid2)` |
| `src/app/actions/chat.ts` | Créer | sendTextMessage, sendMediaMessage, deleteMessage |
| `src/components/timeline/VoiceRecorder.tsx` | Modifier | Ajouter prop `onRecorded` callback |
| `src/components/timeline/ComposeBar.tsx` | Modifier | Passer `onRecorded` à VoiceRecorder |
| `src/components/NavBar.tsx` | Créer | Nav serveur : Timeline + liens vers les 2 autres membres |
| `src/components/chat/MessageBubble.tsx` | Créer | Bulle de message (propre/autre, texte/photo/audio, suppr) |
| `src/components/chat/ChatInput.tsx` | Créer | Barre de saisie chat (texte + photo + vocal) |
| `src/components/chat/ChatView.tsx` | Créer | Client Realtime, liste messages, scroll automatique |
| `src/app/chats/[userId]/page.tsx` | Créer | Page serveur : auth, fetch initial, render ChatView |
| `src/app/page.tsx` | Modifier | Ajouter NavBar au-dessus de Timeline |

---

### Task 1 : Schéma SQL messages

**Files:**
- Create: `supabase/etape4-schema.sql`

- [ ] **Step 1 : Créer la branche feature**

```bash
git checkout main && git pull
git checkout -b etape-4-chats
```

- [ ] **Step 2 : Créer `supabase/etape4-schema.sql`**

```sql
-- supabase/etape4-schema.sql
-- Étape 4 : Chats individuels bilatéraux

-- Table des messages privés
CREATE TABLE messages (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id TEXT        NOT NULL,
  sender_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type            TEXT        NOT NULL CHECK (type IN ('text', 'photo', 'audio')),
  content         TEXT,
  media_url       TEXT,
  audio_duration  INTEGER     CHECK (audio_duration IS NULL OR audio_duration > 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT messages_content_coherence CHECK (
    (type = 'text'  AND content IS NOT NULL AND media_url IS NULL) OR
    (type IN ('photo', 'audio') AND media_url IS NOT NULL AND content IS NULL)
  )
);

CREATE INDEX messages_conversation_idx ON messages (conversation_id, created_at);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Les 2 participants peuvent lire leurs messages
-- conversation_id = [uid1, uid2].sort().join('_')
CREATE POLICY "participants peuvent lire" ON messages
  FOR SELECT USING (
    auth.uid()::text = split_part(conversation_id, '_', 1) OR
    auth.uid()::text = split_part(conversation_id, '_', 2)
  );

-- Seul le sender peut insérer, et il doit être participant
CREATE POLICY "participants peuvent envoyer" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND (
      auth.uid()::text = split_part(conversation_id, '_', 1) OR
      auth.uid()::text = split_part(conversation_id, '_', 2)
    )
  );

-- Seul l'auteur peut supprimer ses messages
CREATE POLICY "auteur peut supprimer" ON messages
  FOR DELETE USING (auth.uid() = sender_id);

-- Activation Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

- [ ] **Step 3 : Exécuter dans Supabase**

Aller sur https://supabase.com/dashboard → projet `zopovxazxkavqqjxlpul` → SQL Editor → coller le SQL ci-dessus → Run.

Vérifier : Tables → `messages` existe avec les colonnes id, conversation_id, sender_id, type, content, media_url, audio_duration, created_at.

- [ ] **Step 4 : Commit**

```bash
git add supabase/etape4-schema.sql
git commit -m "feat: schéma SQL messages pour chats individuels"
```

---

### Task 2 : Types, membres et utilitaire conversation

**Files:**
- Create: `src/types/chat.ts`
- Create: `src/lib/membres.ts`
- Create: `src/lib/conversation.ts`

- [ ] **Step 1 : Créer `src/types/chat.ts`**

```typescript
// src/types/chat.ts

export type Message = {
  id: string
  conversation_id: string
  sender_id: string
  type: 'text' | 'photo' | 'audio'
  content: string | null
  media_url: string | null
  audio_duration: number | null
  created_at: string
}

export type ChatMembre = {
  id: string
  nom: string
  email: string
}
```

- [ ] **Step 2 : Créer `src/lib/membres.ts`**

```typescript
// src/lib/membres.ts
// Liste fixe des 3 membres de khedhiri.me

export type Membre = {
  id: string
  nom: string
  email: string
}

export const MEMBRES: Membre[] = [
  { id: 'b6025d5f-77d5-4208-b489-bcc717ebc01c', nom: 'Houssem', email: 'houssem@khedhiri.me' },
  { id: '1a0967e9-91e0-48f6-a3da-752255274153', nom: 'Sandra',  email: 'sandra@khedhiri.me' },
  { id: '617eff77-47ed-40e0-b784-c027183c9bee', nom: 'Sarah',   email: 'sarah@khedhiri.me' },
]

export function membreById(id: string): Membre | undefined {
  return MEMBRES.find(m => m.id === id)
}
```

- [ ] **Step 3 : Créer `src/lib/conversation.ts`**

```typescript
// src/lib/conversation.ts
// Identifiant de conversation bilatérale déterministe :
// les deux UUIDs sont triés alphabétiquement et joints par '_'

export function conversationId(userId1: string, userId2: string): string {
  return [userId1, userId2].sort().join('_')
}
```

- [ ] **Step 4 : Commit**

```bash
git add src/types/chat.ts src/lib/membres.ts src/lib/conversation.ts
git commit -m "feat: types Message, liste membres et utilitaire conversationId"
```

---

### Task 3 : Server actions pour les messages

**Files:**
- Create: `src/app/actions/chat.ts`

- [ ] **Step 1 : Créer `src/app/actions/chat.ts`**

```typescript
// src/app/actions/chat.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { conversationId } from '@/lib/conversation'

export async function sendTextMessage(otherUserId: string, content: string): Promise<void> {
  if (!content.trim()) return
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const convId = conversationId(user.id, otherUserId)
  const { error } = await supabase.from('messages').insert({
    conversation_id: convId,
    sender_id:       user.id,
    type:            'text',
    content:         content.trim(),
  })
  if (error) throw new Error(error.message)
}

export async function sendMediaMessage(
  otherUserId: string,
  type: 'photo' | 'audio',
  mediaUrl: string,
  audioDuration?: number,
): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const convId = conversationId(user.id, otherUserId)
  const { error } = await supabase.from('messages').insert({
    conversation_id: convId,
    sender_id:       user.id,
    type,
    media_url:       mediaUrl,
    audio_duration:  audioDuration ?? null,
  })
  if (error) throw new Error(error.message)
}

export async function deleteMessage(messageId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId)
    .eq('sender_id', user.id)
  if (error) throw new Error(error.message)
}
```

- [ ] **Step 2 : Commit**

```bash
git add src/app/actions/chat.ts
git commit -m "feat: server actions sendTextMessage, sendMediaMessage, deleteMessage"
```

---

### Task 4 : Découpler VoiceRecorder + mettre à jour ComposeBar

**Files:**
- Modify: `src/components/timeline/VoiceRecorder.tsx`
- Modify: `src/components/timeline/ComposeBar.tsx`

`VoiceRecorder` appelle actuellement `createMediaPost` en dur. On le remplace par un callback `onRecorded(url, duration)` pour que le composant soit réutilisable dans le chat sans duplication de code.

- [ ] **Step 1 : Modifier `src/components/timeline/VoiceRecorder.tsx`**

Lire le fichier. Appliquer ces 3 changements :

**a) Supprimer l'import de `createMediaPost`** — modifier la ligne d'import :
```typescript
// Avant :
import { uploadMedia, createMediaPost } from '@/app/actions/posts'
// Après :
import { uploadMedia } from '@/app/actions/posts'
```

**b) Ajouter `onRecorded` à l'interface** :
```typescript
interface VoiceRecorderProps {
  onDone: () => void
  onCancel: () => void
  onRecorded: (url: string, duration: number) => Promise<void>
}
```

**c) Dans `recorder.onstop`, remplacer l'appel à `createMediaPost`** par le callback :
```typescript
// Avant :
await createMediaPost('audio', mediaUrl, secondsRef.current)
// Après :
await onRecorded(mediaUrl, secondsRef.current)
```

- [ ] **Step 2 : Modifier `src/components/timeline/ComposeBar.tsx`**

Lire le fichier. Trouver l'usage de `<VoiceRecorder>` et ajouter la prop `onRecorded` :

```tsx
<VoiceRecorder
  onDone={() => { setMode('text'); onPosted() }}
  onCancel={() => setMode('text')}
  onRecorded={async (url, dur) => { await createMediaPost('audio', url, dur) }}
/>
```

`createMediaPost` est déjà importé dans ComposeBar — pas de nouvel import.

- [ ] **Step 3 : Commit**

```bash
git add src/components/timeline/VoiceRecorder.tsx src/components/timeline/ComposeBar.tsx
git commit -m "refactor: VoiceRecorder accepte onRecorded callback (découplage de createMediaPost)"
```

---

### Task 5 : NavBar — barre de navigation serveur

**Files:**
- Create: `src/components/NavBar.tsx`

- [ ] **Step 1 : Créer `src/components/NavBar.tsx`**

```tsx
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
      <div className="max-w-lg mx-auto px-4 py-2 flex items-center gap-4">
        {/* Lien timeline */}
        <Link
          href="/"
          className="flex items-center gap-1 text-ink-soft hover:text-terracotta transition-colors"
          aria-label="Retour à la timeline familiale"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span className="text-sm font-manrope hidden sm:inline">Timeline</span>
        </Link>

        {/* Liens vers les chats des 2 autres membres */}
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

- [ ] **Step 2 : Commit**

```bash
git add src/components/NavBar.tsx
git commit -m "feat: NavBar serveur avec liens vers timeline et chats"
```

---

### Task 6 : MessageBubble — bulle de message

**Files:**
- Create: `src/components/chat/MessageBubble.tsx`

- [ ] **Step 1 : Créer `src/components/chat/MessageBubble.tsx`**

```tsx
// src/components/chat/MessageBubble.tsx
'use client'

import { useTransition } from 'react'
import type { Message } from '@/types/chat'
import type { CurrentUser } from '@/types/post'
import { avatarFromEmail, tempsRelatif } from '@/lib/avatar'
import { deleteMessage } from '@/app/actions/chat'
import VoicePlayer from '@/components/timeline/VoicePlayer'

// Map fixe sender_id → email (3 membres hardcodés)
const EMAILS: Record<string, string> = {
  'b6025d5f-77d5-4208-b489-bcc717ebc01c': 'houssem@khedhiri.me',
  '1a0967e9-91e0-48f6-a3da-752255274153': 'sandra@khedhiri.me',
  '617eff77-47ed-40e0-b784-c027183c9bee': 'sarah@khedhiri.me',
}

interface MessageBubbleProps {
  message: Message
  currentUser: CurrentUser
}

export default function MessageBubble({ message, currentUser }: MessageBubbleProps) {
  const [isPending, startTransition] = useTransition()
  const isOwn = message.sender_id === currentUser.id
  const senderEmail = EMAILS[message.sender_id] ?? ''
  const avatar = avatarFromEmail(senderEmail)

  function handleDelete() {
    if (!confirm('Supprimer ce message ?')) return
    startTransition(async () => {
      await deleteMessage(message.id)
    })
  }

  return (
    <div className={`flex items-end gap-2 mb-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar (affiché uniquement pour les messages des autres) */}
      {!isOwn && (
        <span
          className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold font-manrope flex-shrink-0 ${avatar.couleurBg}`}
          aria-hidden="true"
        >
          {avatar.initiale}
        </span>
      )}

      <div className={`flex flex-col gap-1 max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Bulle */}
        <div
          className={`rounded-2xl px-3 py-2 ${
            isOwn
              ? 'bg-terracotta text-white rounded-br-sm'
              : 'bg-jasmine text-ink rounded-bl-sm'
          }`}
        >
          {message.type === 'text' && (
            <p className="font-manrope text-sm whitespace-pre-wrap">{message.content}</p>
          )}
          {message.type === 'photo' && (
            <img
              src={message.media_url!}
              alt="Photo envoyée"
              className="rounded-xl max-w-full max-h-60 object-cover"
            />
          )}
          {message.type === 'audio' && (
            <VoicePlayer url={message.media_url!} duration={message.audio_duration} />
          )}
        </div>

        {/* Horodatage + bouton suppression */}
        <div className={`flex items-center gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-xs text-ink-soft font-manrope">
            {tempsRelatif(message.created_at)}
          </span>
          {isOwn && (
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="text-ink-soft hover:text-terracotta transition-colors disabled:opacity-40"
              aria-label="Supprimer ce message"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4h6v2" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2 : Commit**

```bash
git add src/components/chat/MessageBubble.tsx
git commit -m "feat: composant MessageBubble (texte, photo, audio, suppression)"
```

---

### Task 7 : ChatInput — barre de saisie du chat

**Files:**
- Create: `src/components/chat/ChatInput.tsx`

- [ ] **Step 1 : Créer `src/components/chat/ChatInput.tsx`**

```tsx
// src/components/chat/ChatInput.tsx
'use client'

import { useRef, useState, useTransition } from 'react'
import { sendTextMessage, sendMediaMessage } from '@/app/actions/chat'
import { uploadMedia } from '@/app/actions/posts'
import VoiceRecorder from '@/components/timeline/VoiceRecorder'

interface ChatInputProps {
  otherUserId: string
  onSent: () => void
}

export default function ChatInput({ otherUserId, onSent }: ChatInputProps) {
  const [text, setText] = useState('')
  const [mode, setMode] = useState<'text' | 'voice'>('text')
  const [isPending, startTransition] = useTransition()
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleSubmit() {
    if (!text.trim()) return
    setError(null)
    startTransition(async () => {
      try {
        await sendTextMessage(otherUserId, text)
        setText('')
        onSent()
      } catch {
        setError('Impossible d\'envoyer le message. Réessaie.')
      }
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingPhoto(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const url = await uploadMedia(formData)
      await sendMediaMessage(otherUserId, 'photo', url)
      onSent()
    } catch {
      setError('Impossible d\'envoyer la photo. Réessaie.')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
      setIsUploadingPhoto(false)
    }
  }

  if (mode === 'voice') {
    return (
      <div className="bg-cream border-t border-terracotta/20 p-4">
        <VoiceRecorder
          onDone={() => { setMode('text'); onSent() }}
          onCancel={() => setMode('text')}
          onRecorded={async (url, dur) => {
            await sendMediaMessage(otherUserId, 'audio', url, dur)
          }}
        />
      </div>
    )
  }

  return (
    <div className="bg-cream border-t border-terracotta/20 p-3">
      <div className="max-w-lg mx-auto">
        {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
        <div className="flex items-end gap-2">
          {/* Bouton photo */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending || isUploadingPhoto}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-jasmine text-ink-soft hover:text-terracotta transition-colors disabled:opacity-40 flex-shrink-0"
            aria-label="Envoyer une photo"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </button>

          {/* Zone de texte */}
          <textarea
            value={text}
            onChange={e => { setText(e.target.value); setError(null) }}
            onKeyDown={handleKeyDown}
            placeholder="Écris un message ♡"
            rows={1}
            aria-label="Écris un message"
            disabled={isPending || isUploadingPhoto}
            className="flex-1 resize-none rounded-2xl border border-terracotta/20 bg-jasmine px-3 py-2 text-sm font-manrope text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-terracotta/30 disabled:opacity-50"
            style={{ minHeight: '38px', maxHeight: '120px' }}
          />

          {/* Bouton micro */}
          <button
            type="button"
            onClick={() => setMode('voice')}
            disabled={isPending || isUploadingPhoto}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-jasmine text-ink-soft hover:text-terracotta transition-colors disabled:opacity-40 flex-shrink-0"
            aria-label="Enregistrer un message vocal"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>

          {/* Bouton envoyer */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!text.trim() || isPending || isUploadingPhoto}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-terracotta text-white hover:bg-terracotta-deep transition-colors disabled:opacity-40 flex-shrink-0"
            aria-label="Envoyer"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelected}
          aria-hidden="true"
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2 : Commit**

```bash
git add src/components/chat/ChatInput.tsx
git commit -m "feat: composant ChatInput (texte, photo, vocal)"
```

---

### Task 8 : ChatView — vue principale du chat

**Files:**
- Create: `src/components/chat/ChatView.tsx`

- [ ] **Step 1 : Créer `src/components/chat/ChatView.tsx`**

```tsx
// src/components/chat/ChatView.tsx
'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { Message } from '@/types/chat'
import type { CurrentUser } from '@/types/post'
import type { Membre } from '@/lib/membres'
import { avatarFromEmail } from '@/lib/avatar'
import MessageBubble from '@/components/chat/MessageBubble'
import ChatInput from '@/components/chat/ChatInput'

interface ChatViewProps {
  initialMessages: Message[]
  currentUser: CurrentUser
  otherUser: Membre
  conversationId: string
  supabaseUrl: string
  supabaseAnonKey: string
}

export default function ChatView({
  initialMessages,
  currentUser,
  otherUser,
  conversationId,
  supabaseUrl,
  supabaseAnonKey,
}: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const bottomRef = useRef<HTMLDivElement>(null)
  const otherAvatar = avatarFromEmail(otherUser.email)

  const supabase = useMemo(
    () => createBrowserClient(supabaseUrl, supabaseAnonKey),
    [supabaseUrl, supabaseAnonKey],
  )

  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(100)
    if (data) setMessages(data as Message[])
  }, [supabase, conversationId])

  useEffect(() => {
    fetchMessages()
    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, () => fetchMessages())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase, conversationId, fetchMessages])

  // Scroll automatique vers le bas à chaque nouveau message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex flex-col min-h-screen bg-cream">
      {/* En-tête du chat */}
      <div className="bg-cream border-b border-terracotta/20 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <span
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold font-manrope ${otherAvatar.couleurBg}`}
            aria-hidden="true"
          >
            {otherAvatar.initiale}
          </span>
          <div>
            <p className="font-fraunces text-ink font-semibold">{otherAvatar.nom}</p>
            <p className="text-xs text-ink-soft font-manrope">{otherUser.email}</p>
          </div>
        </div>
      </div>

      {/* Liste des messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        <div className="max-w-lg mx-auto">
          {messages.length === 0 ? (
            <p className="font-caveat text-xl text-ink-soft text-center mt-12">
              Commencez à vous écrire ♡
            </p>
          ) : (
            messages.map(msg => (
              <MessageBubble
                key={msg.id}
                message={msg}
                currentUser={currentUser}
              />
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Barre de saisie sticky */}
      <div className="sticky bottom-0">
        <ChatInput otherUserId={otherUser.id} onSent={fetchMessages} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2 : Commit**

```bash
git add src/components/chat/ChatView.tsx
git commit -m "feat: composant ChatView avec Realtime et scroll automatique"
```

---

### Task 9 : Page `/chats/[userId]`

**Files:**
- Create: `src/app/chats/[userId]/page.tsx`

- [ ] **Step 1 : Créer `src/app/chats/[userId]/page.tsx`**

```tsx
// src/app/chats/[userId]/page.tsx
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { membreById } from '@/lib/membres'
import { conversationId } from '@/lib/conversation'
import NavBar from '@/components/NavBar'
import ChatView from '@/components/chat/ChatView'
import type { Message } from '@/types/chat'
import type { CurrentUser } from '@/types/post'

export default async function ChatPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Vérification que l'autre utilisateur est un membre connu et pas soi-même
  const autreUser = membreById(userId)
  if (!autreUser || autreUser.id === user.id) notFound()

  const convId = conversationId(user.id, userId)

  const { data: initialMessages } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', convId)
    .order('created_at', { ascending: true })
    .limit(100)

  const currentUser: CurrentUser = { id: user.id, email: user.email ?? '' }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return (
    <>
      <NavBar />
      <ChatView
        initialMessages={(initialMessages ?? []) as Message[]}
        currentUser={currentUser}
        otherUser={autreUser}
        conversationId={convId}
        supabaseUrl={supabaseUrl}
        supabaseAnonKey={supabaseAnonKey}
      />
    </>
  )
}
```

- [ ] **Step 2 : Commit**

```bash
git add src/app/chats/
git commit -m "feat: page /chats/[userId] avec SSR initial messages"
```

---

### Task 10 : NavBar sur la timeline + déploiement

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1 : Modifier `src/app/page.tsx`**

Lire `src/app/page.tsx`. Ajouter l'import de NavBar et l'inclure dans le return :

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Timeline from '@/components/timeline/Timeline'
import NavBar from '@/components/NavBar'
import type { Post, CurrentUser } from '@/types/post'

export default async function AccueilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: initialPosts } = await supabase
    .from('posts')
    .select('*, reactions(*), profiles(email, nom)')
    .order('created_at', { ascending: false })
    .limit(50)

  const currentUser: CurrentUser = {
    id: user.id,
    email: user.email ?? '',
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return (
    <>
      <NavBar />
      <Timeline
        initialPosts={(initialPosts ?? []) as Post[]}
        currentUser={currentUser}
        supabaseUrl={supabaseUrl}
        supabaseAnonKey={supabaseAnonKey}
      />
    </>
  )
}
```

- [ ] **Step 2 : Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: NavBar ajoutée à la page d'accueil (timeline)"
```

- [ ] **Step 3 : Push + créer la PR**

```bash
git push -u origin etape-4-chats
gh pr create \
  --title "Étape 4 — Chats individuels temps réel (Papa↔Sandra, Papa↔Sarah, Sandra↔Sarah)" \
  --body "## Résumé
- Table \`messages\` avec RLS et Realtime
- 3 chats bilatéraux (conversation_id = sort([uid1,uid2]).join('_'))
- Messages texte, photo et audio
- NavBar persistante avec liens vers les chats
- VoiceRecorder découplé via onRecorded callback
## Plan de test
- [ ] Se connecter houssem@khedhiri.me → NavBar visible
- [ ] Cliquer Sandra → page chat ouvre
- [ ] Envoyer un texte → apparaît à droite
- [ ] Se connecter sandra@khedhiri.me → message de Houssem visible à gauche, en temps réel
- [ ] Envoyer une photo et un vocal depuis Sandra
- [ ] Supprimer son propre message
- [ ] Tester Sandra↔Sarah (pas de fuite entre chats)"
```

- [ ] **Step 4 : Merger la PR**

```bash
gh pr merge <numéro> --merge --delete-branch
```

- [ ] **Step 5 : Vérifier sur khedhiri.me**

Attendre le déploiement Vercel (2-3 min). Se connecter → vérifier la NavBar → ouvrir un chat → envoyer des messages des deux côtés.

- [ ] **Step 6 : Mettre à jour CLAUDE.md**

Dans `CLAUDE.md` :
- Marquer `- [x] **Étape 4**` dans la roadmap
- Ajouter une ligne dans le Journal des sessions :
  `| Avril 2026 | Étape 4 | Chats individuels bilatéraux temps réel (texte/photo/audio), NavBar, VoiceRecorder découplé, RLS par conversation_id, déployé sur khedhiri.me |`

```bash
git add CLAUDE.md
git commit -m "docs: étape 4 terminée — chats individuels déployés"
git push
```
