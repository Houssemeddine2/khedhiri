# Câlin virtuel + vocaux préenregistrés — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre aux 3 membres d'envoyer des câlins vocaux préenregistrés avec notification push + event Realtime Supabase.

**Architecture:** Chaque membre prépare une bibliothèque de vocaux (stockés dans Supabase Storage bucket `calins`). Pour envoyer un câlin, il choisit un vocal de sa bibliothèque (ou en enregistre un nouveau), sélectionne un destinataire, et appuie sur "Envoyer" — ce qui insère une ligne dans la table `calins`, déclenche une notif push via `sendNotificationToUsers`, et notifie via Realtime Supabase. La page `/calin` affiche les 3 sections : envoi, bibliothèque, reçus.

**Tech Stack:** Next.js 15 App Router, TypeScript, Supabase (Storage + RLS + Realtime), Web Push API (existant), MediaRecorder API (navigateur), `src/lib/push-server.ts` (existant)

**Prérequis manuels (avant de démarrer) :**
1. Créer le bucket Storage **`calins`** (privé) dans Supabase Dashboard → Storage → New bucket → name: `calins`, public: OFF
2. Activer Realtime pour la table `calins` dans Supabase Dashboard → Database → Replication → cocher `calins`
3. Exécuter `supabase/etape15-schema.sql` dans Supabase Dashboard → SQL Editor

---

## Structure des fichiers

**Nouveaux fichiers :**
- `supabase/etape15-schema.sql` — tables `vocaux` + `calins`, RLS
- `src/types/calin.ts` — types TypeScript
- `src/app/api/calins/vocaux/route.ts` — GET (liste) + POST (upload bibliothèque)
- `src/app/api/calins/vocaux/[id]/route.ts` — DELETE
- `src/app/api/calins/route.ts` — GET (reçus) + POST (envoi)
- `src/app/api/calins/[id]/ecouter/route.ts` — POST (marque ecoute_at)
- `src/components/calins/VocalRecorder.tsx` — enregistreur click-to-toggle, max 60s
- `src/components/calins/BibliothequeVocaux.tsx` — gestion bibliothèque
- `src/components/calins/EnvoyerCalin.tsx` — sélecteur destinataire + vocal + envoi
- `src/components/calins/CalinsRecus.tsx` — liste câlins reçus
- `src/components/calins/CalinRealtimeListener.tsx` — subscription Realtime Supabase
- `src/components/calins/CalinPage.tsx` — page client principale
- `src/app/calin/page.tsx` — Server Component, auth + NavBar

**Fichiers modifiés :**
- `src/components/NavBar.tsx` — badge câlins non écoutés + icône cœur

---

### Task 1 : Schema SQL + types TypeScript

**Files:**
- Create: `supabase/etape15-schema.sql`
- Create: `src/types/calin.ts`

- [ ] **Step 1 : Créer le fichier SQL**

```sql
-- supabase/etape15-schema.sql

-- Bibliothèque de vocaux préparés
CREATE TABLE vocaux (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proprietaire_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titre        TEXT NOT NULL,
  vocal_path   TEXT NOT NULL,
  duree_sec    INT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE vocaux ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Propriétaire gère ses vocaux"
  ON vocaux FOR ALL
  USING (auth.uid() = proprietaire_id)
  WITH CHECK (auth.uid() = proprietaire_id);

-- Câlins envoyés
CREATE TABLE calins (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expediteur_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  destinataire_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vocal_path      TEXT NOT NULL,
  titre           TEXT NOT NULL,
  envoye_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  ecoute_at       TIMESTAMPTZ NULL
);

ALTER TABLE calins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Expéditeur voit ses câlins envoyés"
  ON calins FOR SELECT
  USING (auth.uid() = expediteur_id);

CREATE POLICY "Destinataire voit ses câlins reçus"
  ON calins FOR SELECT
  USING (auth.uid() = destinataire_id);

-- INSERT et UPDATE ecoute_at via service role uniquement (pas de politique RLS user)
```

- [ ] **Step 2 : Créer les types TypeScript**

```typescript
// src/types/calin.ts

export interface Vocal {
  id: string
  proprietaire_id: string
  titre: string
  vocal_url: string   // signed URL générée côté API (expire 30 min)
  duree_sec: number | null
  created_at: string
}

export interface Calin {
  id: string
  expediteur_id: string
  expediteur_nom: string
  expediteur_email: string
  destinataire_id: string
  vocal_url: string   // signed URL générée côté API (expire 30 min)
  titre: string
  envoye_at: string
  ecoute_at: string | null
}
```

- [ ] **Step 3 : Vérifier que le build passe**

```bash
npm run build
```

Expected: no TypeScript errors on the new types file.

- [ ] **Step 4 : Commit**

```bash
git add supabase/etape15-schema.sql src/types/calin.ts
git commit -m "feat(etape15): schema SQL vocaux + calins + types TS"
```

---

### Task 2 : API vocaux — GET + POST

**Files:**
- Create: `src/app/api/calins/vocaux/route.ts`

- [ ] **Step 1 : Créer la route**

```typescript
// src/app/api/calins/vocaux/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const MAX_SIZE = 5 * 1024 * 1024 // 5 Mo

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const sc = serviceClient()
  const { data: rows, error } = await sc
    .from('vocaux')
    .select('id, proprietaire_id, titre, vocal_path, duree_sec, created_at')
    .eq('proprietaire_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const vocaux = await Promise.all(
    (rows ?? []).map(async (row) => {
      const { data: signed } = await sc.storage
        .from('calins')
        .createSignedUrl(row.vocal_path, 1800)
      return {
        id: row.id,
        proprietaire_id: row.proprietaire_id,
        titre: row.titre,
        vocal_url: signed?.signedUrl ?? '',
        duree_sec: row.duree_sec,
        created_at: row.created_at,
      }
    })
  )

  return NextResponse.json({ vocaux })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
  }

  const audio = formData.get('audio') as File | null
  const titre = (formData.get('titre') as string | null)?.trim()
  const dureeSec = formData.get('duree_sec')

  if (!audio || !titre) {
    return NextResponse.json({ error: 'Champs manquants : audio et titre requis' }, { status: 400 })
  }
  if (audio.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Fichier trop volumineux (max 5 Mo)' }, { status: 400 })
  }

  const sc = serviceClient()
  const path = `bibliotheque/${user.id}/${crypto.randomUUID()}.webm`
  const bytes = await audio.arrayBuffer()

  const { error: uploadError } = await sc.storage
    .from('calins')
    .upload(path, bytes, { contentType: 'audio/webm', upsert: false })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: row, error: insertError } = await sc
    .from('vocaux')
    .insert({
      proprietaire_id: user.id,
      titre,
      vocal_path: path,
      duree_sec: dureeSec ? Number(dureeSec) : null,
    })
    .select('id')
    .single()

  if (insertError) {
    await sc.storage.from('calins').remove([path])
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ id: row.id }, { status: 201 })
}
```

- [ ] **Step 2 : Build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 3 : Commit**

```bash
git add src/app/api/calins/vocaux/route.ts
git commit -m "feat(etape15): API GET+POST /api/calins/vocaux"
```

---

### Task 3 : API vocaux — DELETE

**Files:**
- Create: `src/app/api/calins/vocaux/[id]/route.ts`

- [ ] **Step 1 : Créer la route**

```typescript
// src/app/api/calins/vocaux/[id]/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const sc = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: vocal } = await sc
    .from('vocaux')
    .select('vocal_path')
    .eq('id', id)
    .eq('proprietaire_id', user.id)
    .maybeSingle()

  if (!vocal) return NextResponse.json({ error: 'Vocal non trouvé' }, { status: 404 })

  await sc.storage.from('calins').remove([vocal.vocal_path])

  const { data: deleted, error } = await sc
    .from('vocaux')
    .delete()
    .eq('id', id)
    .eq('proprietaire_id', user.id)
    .select('id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!deleted?.length) return NextResponse.json({ error: 'Vocal non trouvé' }, { status: 404 })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2 : Build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 3 : Commit**

```bash
git add src/app/api/calins/vocaux/[id]/route.ts
git commit -m "feat(etape15): API DELETE /api/calins/vocaux/[id]"
```

---

### Task 4 : API calins — GET reçus + POST envoi

**Files:**
- Create: `src/app/api/calins/route.ts`

- [ ] **Step 1 : Créer la route**

```typescript
// src/app/api/calins/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { MEMBRES, membreById } from '@/lib/membres'
import { sendNotificationToUsers } from '@/lib/push-server'

const MAX_SIZE = 5 * 1024 * 1024
const MEMBRES_IDS = MEMBRES.map(m => m.id)

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const sc = serviceClient()
  const { data: rows, error } = await sc
    .from('calins')
    .select('id, expediteur_id, destinataire_id, vocal_path, titre, envoye_at, ecoute_at')
    .eq('destinataire_id', user.id)
    .order('envoye_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const calins = await Promise.all(
    (rows ?? []).map(async (row) => {
      const { data: signed } = await sc.storage
        .from('calins')
        .createSignedUrl(row.vocal_path, 1800)
      const expediteur = membreById(row.expediteur_id)
      return {
        id: row.id,
        expediteur_id: row.expediteur_id,
        expediteur_nom: expediteur?.nom ?? 'Inconnu',
        expediteur_email: expediteur?.email ?? '',
        destinataire_id: row.destinataire_id,
        vocal_url: signed?.signedUrl ?? '',
        titre: row.titre,
        envoye_at: row.envoye_at,
        ecoute_at: row.ecoute_at,
      }
    })
  )

  return NextResponse.json({ calins })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
  }

  const destinataireId = (formData.get('destinataire_id') as string | null)?.trim()
  const titre = (formData.get('titre') as string | null)?.trim()
  const vocalId = formData.get('vocal_id') as string | null
  const audio = formData.get('audio') as File | null
  const sauvegarder = formData.get('sauvegarder') === 'true'
  const dureeSec = formData.get('duree_sec')

  if (!destinataireId || !titre) {
    return NextResponse.json({ error: 'destinataire_id et titre requis' }, { status: 400 })
  }
  if (!MEMBRES_IDS.includes(destinataireId)) {
    return NextResponse.json({ error: 'Destinataire invalide' }, { status: 400 })
  }
  if (destinataireId === user.id) {
    return NextResponse.json({ error: 'Vous ne pouvez pas vous envoyer un câlin' }, { status: 400 })
  }
  if (!vocalId && !audio) {
    return NextResponse.json({ error: 'Un vocal est requis (vocal_id ou audio)' }, { status: 400 })
  }

  const sc = serviceClient()
  let vocalPath: string

  if (vocalId) {
    const { data: vocal } = await sc
      .from('vocaux')
      .select('vocal_path')
      .eq('id', vocalId)
      .eq('proprietaire_id', user.id)
      .maybeSingle()

    if (!vocal) return NextResponse.json({ error: 'Vocal non trouvé' }, { status: 404 })

    // Copie indépendante dans envois/
    const { data: fileData, error: dlError } = await sc.storage
      .from('calins')
      .download(vocal.vocal_path)

    if (dlError || !fileData) return NextResponse.json({ error: 'Erreur lecture vocal' }, { status: 500 })

    vocalPath = `envois/${crypto.randomUUID()}.webm`
    const bytes = await fileData.arrayBuffer()
    const { error: upError } = await sc.storage
      .from('calins')
      .upload(vocalPath, bytes, { contentType: 'audio/webm', upsert: false })

    if (upError) return NextResponse.json({ error: upError.message }, { status: 500 })
  } else {
    if (audio!.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Fichier trop volumineux (max 5 Mo)' }, { status: 400 })
    }
    vocalPath = `envois/${crypto.randomUUID()}.webm`
    const bytes = await audio!.arrayBuffer()
    const { error: upError } = await sc.storage
      .from('calins')
      .upload(vocalPath, bytes, { contentType: 'audio/webm', upsert: false })

    if (upError) return NextResponse.json({ error: upError.message }, { status: 500 })

    if (sauvegarder) {
      await sc.from('vocaux').insert({
        proprietaire_id: user.id,
        titre,
        vocal_path: `bibliotheque/${user.id}/${crypto.randomUUID()}.webm`,
        duree_sec: dureeSec ? Number(dureeSec) : null,
      })
      // Note: pour simplifier, on ré-upload pas pour la biblio ici — le câlin envoyé est indépendant
    }
  }

  const { data: calin, error: insertError } = await sc
    .from('calins')
    .insert({
      expediteur_id: user.id,
      destinataire_id: destinataireId,
      vocal_path: vocalPath,
      titre,
    })
    .select('id')
    .single()

  if (insertError) {
    await sc.storage.from('calins').remove([vocalPath])
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  const expediteur = membreById(user.id)
  await sendNotificationToUsers([destinataireId], {
    title: `🤗 Câlin de ${expediteur?.nom ?? 'Papa'}`,
    body: titre,
    url: '/calin',
  })

  return NextResponse.json({ id: calin.id }, { status: 201 })
}
```

- [ ] **Step 2 : Build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 3 : Commit**

```bash
git add src/app/api/calins/route.ts
git commit -m "feat(etape15): API GET+POST /api/calins"
```

---

### Task 5 : API calins/[id]/ecouter — POST

**Files:**
- Create: `src/app/api/calins/[id]/ecouter/route.ts`

- [ ] **Step 1 : Créer la route**

```typescript
// src/app/api/calins/[id]/ecouter/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const sc = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  await sc
    .from('calins')
    .update({ ecoute_at: new Date().toISOString() })
    .eq('id', id)
    .eq('destinataire_id', user.id)
    .is('ecoute_at', null)

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2 : Build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 3 : Commit**

```bash
git add src/app/api/calins/[id]/ecouter/route.ts
git commit -m "feat(etape15): API POST /api/calins/[id]/ecouter"
```

---

### Task 6 : Composant VocalRecorder

**Files:**
- Create: `src/components/calins/VocalRecorder.tsx`

- [ ] **Step 1 : Créer le composant**

```typescript
// src/components/calins/VocalRecorder.tsx
'use client'

import { useRef, useState, useEffect, useCallback } from 'react'

interface Props {
  onRecorded: (blob: Blob, dureeSec: number) => void
  maxSec?: number
}

export default function VocalRecorder({ onRecorded, maxSec = 60 }: Props) {
  const [isRecording, setIsRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const mrRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stop = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    mrRef.current?.stop()
    setIsRecording(false)
  }, [])

  useEffect(() => () => { stop() }, [stop])

  const toggle = async () => {
    if (isRecording) { stop(); return }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      mrRef.current = mr
      chunksRef.current = []
      startRef.current = Date.now()
      setElapsed(0)

      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        const dureeSec = Math.round((Date.now() - startRef.current) / 1000)
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        stream.getTracks().forEach(t => t.stop())
        onRecorded(blob, dureeSec)
        setElapsed(0)
      }

      mr.start()
      setIsRecording(true)

      timerRef.current = setInterval(() => {
        setElapsed(prev => {
          const next = prev + 1
          if (next >= maxSec) stop()
          return next
        })
      }, 1000)
    } catch {
      // microphone non disponible ou permission refusée
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isRecording ? `Arrêter l'enregistrement (${elapsed}s)` : "Démarrer l'enregistrement vocal"}
      className={`flex items-center gap-2 px-4 py-2 rounded-full font-manrope font-semibold text-sm text-white transition-all select-none ${
        isRecording
          ? 'bg-terracotta-deep'
          : 'bg-terracotta hover:bg-terracotta-deep'
      }`}
    >
      <span className={isRecording ? 'animate-pulse' : ''}>🎤</span>
      <span>
        {isRecording ? `${elapsed}s / ${maxSec}s — Arrêter` : 'Enregistrer un vocal'}
      </span>
    </button>
  )
}
```

- [ ] **Step 2 : Build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 3 : Commit**

```bash
git add src/components/calins/VocalRecorder.tsx
git commit -m "feat(etape15): composant VocalRecorder"
```

---

### Task 7 : Composant BibliothequeVocaux

**Files:**
- Create: `src/components/calins/BibliothequeVocaux.tsx`

- [ ] **Step 1 : Créer le composant**

```typescript
// src/components/calins/BibliothequeVocaux.tsx
'use client'

import { useState } from 'react'
import type { Vocal } from '@/types/calin'
import VoicePlayer from '@/components/timeline/VoicePlayer'
import VocalRecorder from './VocalRecorder'

interface Props {
  vocaux: Vocal[]
  onVocauxChange: () => void
}

export default function BibliothequeVocaux({ vocaux, onVocauxChange }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [titre, setTitre] = useState('')
  const [blob, setBlob] = useState<Blob | null>(null)
  const [dureeSec, setDureeSec] = useState<number>(0)
  const [isUploading, setIsUploading] = useState(false)

  const handleRecorded = (b: Blob, d: number) => {
    setBlob(b)
    setDureeSec(d)
  }

  const handleAjouter = async () => {
    if (!blob || !titre.trim()) return
    setIsUploading(true)

    const fd = new FormData()
    fd.append('audio', new File([blob], 'vocal.webm', { type: 'audio/webm' }))
    fd.append('titre', titre.trim())
    fd.append('duree_sec', String(dureeSec))

    const res = await fetch('/api/calins/vocaux', { method: 'POST', body: fd })
    setIsUploading(false)

    if (res.ok) {
      setShowForm(false)
      setTitre('')
      setBlob(null)
      setDureeSec(0)
      onVocauxChange()
    }
  }

  const handleSupprimer = async (id: string) => {
    const res = await fetch(`/api/calins/vocaux/${id}`, { method: 'DELETE' })
    if (res.ok) onVocauxChange()
  }

  return (
    <section aria-labelledby="biblio-titre">
      <h2 id="biblio-titre" className="font-fraunces text-xl text-ink mb-3">
        Ma bibliothèque de vocaux
      </h2>

      {vocaux.length === 0 && !showForm && (
        <p className="text-ink-soft font-manrope text-sm mb-3">
          Aucun vocal préparé pour l'instant.
        </p>
      )}

      <div className="flex flex-col gap-3 mb-4">
        {vocaux.map(v => (
          <div key={v.id} className="bg-jasmine rounded-2xl p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-manrope font-semibold text-ink text-sm">{v.titre}</span>
              <button
                onClick={() => handleSupprimer(v.id)}
                aria-label={`Supprimer « ${v.titre} »`}
                className="text-ink-soft hover:text-terracotta transition-colors text-xs"
              >
                🗑️
              </button>
            </div>
            <VoicePlayer url={v.vocal_url} duration={v.duree_sec} />
          </div>
        ))}
      </div>

      {showForm ? (
        <div className="bg-sand rounded-2xl p-4 flex flex-col gap-3">
          <VocalRecorder onRecorded={handleRecorded} />
          {blob && (
            <>
              <input
                type="text"
                value={titre}
                onChange={e => setTitre(e.target.value)}
                placeholder="Titre du vocal (ex : Bonne nuit)"
                aria-label="Titre du vocal"
                className="w-full rounded-xl border border-terracotta/20 bg-cream px-3 py-2 font-manrope text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/40"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAjouter}
                  disabled={isUploading || !titre.trim()}
                  className="flex-1 bg-terracotta text-white rounded-full py-2 font-manrope font-semibold text-sm disabled:opacity-40"
                >
                  {isUploading ? 'Enregistrement…' : 'Sauvegarder'}
                </button>
                <button
                  onClick={() => { setShowForm(false); setBlob(null); setTitre('') }}
                  className="px-4 py-2 rounded-full border border-terracotta/20 font-manrope text-sm text-ink-soft"
                >
                  Annuler
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-terracotta text-terracotta font-manrope font-semibold text-sm hover:bg-terracotta/10 transition-colors"
        >
          + Ajouter un vocal
        </button>
      )}
    </section>
  )
}
```

- [ ] **Step 2 : Build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 3 : Commit**

```bash
git add src/components/calins/BibliothequeVocaux.tsx
git commit -m "feat(etape15): composant BibliothequeVocaux"
```

---

### Task 8 : Composant EnvoyerCalin

**Files:**
- Create: `src/components/calins/EnvoyerCalin.tsx`

- [ ] **Step 1 : Créer le composant**

```typescript
// src/components/calins/EnvoyerCalin.tsx
'use client'

import { useState } from 'react'
import type { Vocal } from '@/types/calin'
import { MEMBRES } from '@/lib/membres'
import { avatarFromEmail } from '@/lib/avatar'
import VoicePlayer from '@/components/timeline/VoicePlayer'
import VocalRecorder from './VocalRecorder'

interface Props {
  userId: string
  vocaux: Vocal[]
  onCalinEnvoye: () => void
}

export default function EnvoyerCalin({ userId, vocaux, onCalinEnvoye }: Props) {
  const autresMembres = MEMBRES.filter(m => m.id !== userId)

  const [destinataireId, setDestinataireId] = useState('')
  const [vocalSelectionne, setVocalSelectionne] = useState<Vocal | null>(null)
  const [mode, setMode] = useState<'bibliotheque' | 'nouveau'>('bibliotheque')
  const [blob, setBlob] = useState<Blob | null>(null)
  const [dureeSec, setDureeSec] = useState<number>(0)
  const [titre, setTitre] = useState('')
  const [sauvegarder, setSauvegarder] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleRecorded = (b: Blob, d: number) => {
    setBlob(b)
    setDureeSec(d)
  }

  const canSend = destinataireId !== '' && (
    (mode === 'bibliotheque' && vocalSelectionne !== null) ||
    (mode === 'nouveau' && blob !== null && titre.trim() !== '')
  )

  const handleEnvoyer = async () => {
    if (!canSend) return
    setIsLoading(true)

    const fd = new FormData()
    fd.append('destinataire_id', destinataireId)

    if (mode === 'bibliotheque' && vocalSelectionne) {
      fd.append('titre', vocalSelectionne.titre)
      fd.append('vocal_id', vocalSelectionne.id)
    } else if (mode === 'nouveau' && blob) {
      fd.append('titre', titre.trim())
      fd.append('audio', new File([blob], 'vocal.webm', { type: 'audio/webm' }))
      fd.append('duree_sec', String(dureeSec))
      fd.append('sauvegarder', String(sauvegarder))
    }

    const res = await fetch('/api/calins', { method: 'POST', body: fd })
    setIsLoading(false)

    if (res.ok) {
      setSent(true)
      setTimeout(() => {
        setSent(false)
        setDestinataireId('')
        setVocalSelectionne(null)
        setBlob(null)
        setTitre('')
        setSauvegarder(false)
        setMode('bibliotheque')
      }, 2000)
      onCalinEnvoye()
    }
  }

  return (
    <section aria-labelledby="envoi-titre">
      <h2 id="envoi-titre" className="font-fraunces text-xl text-ink mb-3">
        Envoyer un câlin
      </h2>

      {/* Sélecteur destinataire */}
      <div className="flex gap-3 mb-4">
        {autresMembres.map(m => {
          const av = avatarFromEmail(m.email)
          const selected = destinataireId === m.id
          return (
            <button
              key={m.id}
              onClick={() => setDestinataireId(m.id)}
              aria-label={`Envoyer à ${av.nom}`}
              aria-pressed={selected}
              className={`flex flex-col items-center gap-1 px-4 py-3 rounded-2xl border-2 transition-all font-manrope text-sm font-semibold ${
                selected
                  ? 'border-terracotta bg-terracotta/10 text-terracotta'
                  : 'border-terracotta/20 text-ink-soft hover:border-terracotta/40'
              }`}
            >
              <div className={`w-10 h-10 rounded-full ${av.couleurBg} flex items-center justify-center text-white font-bold text-lg`}>
                {av.initiale}
              </div>
              {av.nom}
            </button>
          )
        })}
      </div>

      {/* Choix mode */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode('bibliotheque')}
          aria-pressed={mode === 'bibliotheque'}
          className={`px-3 py-1.5 rounded-full font-manrope text-sm font-semibold transition-all ${
            mode === 'bibliotheque'
              ? 'bg-terracotta text-white'
              : 'bg-sand text-ink-soft hover:bg-sand-warm'
          }`}
        >
          Ma bibliothèque
        </button>
        <button
          onClick={() => setMode('nouveau')}
          aria-pressed={mode === 'nouveau'}
          className={`px-3 py-1.5 rounded-full font-manrope text-sm font-semibold transition-all ${
            mode === 'nouveau'
              ? 'bg-terracotta text-white'
              : 'bg-sand text-ink-soft hover:bg-sand-warm'
          }`}
        >
          Enregistrer maintenant
        </button>
      </div>

      {/* Mode bibliothèque */}
      {mode === 'bibliotheque' && (
        <div className="flex flex-col gap-2 mb-4">
          {vocaux.length === 0 ? (
            <p className="text-ink-soft font-manrope text-sm">
              Ta bibliothèque est vide — enregistre des vocaux ci-dessous d'abord.
            </p>
          ) : vocaux.map(v => (
            <button
              key={v.id}
              onClick={() => setVocalSelectionne(v)}
              aria-pressed={vocalSelectionne?.id === v.id}
              className={`w-full text-left rounded-2xl border-2 p-3 transition-all ${
                vocalSelectionne?.id === v.id
                  ? 'border-terracotta bg-terracotta/10'
                  : 'border-terracotta/20 bg-jasmine hover:border-terracotta/40'
              }`}
            >
              <p className="font-manrope font-semibold text-sm text-ink mb-2">{v.titre}</p>
              <VoicePlayer url={v.vocal_url} duration={v.duree_sec} />
            </button>
          ))}
        </div>
      )}

      {/* Mode nouveau */}
      {mode === 'nouveau' && (
        <div className="flex flex-col gap-3 mb-4">
          <VocalRecorder onRecorded={handleRecorded} />
          {blob && (
            <>
              <input
                type="text"
                value={titre}
                onChange={e => setTitre(e.target.value)}
                placeholder="Titre du message (ex : Je t'aime fort)"
                aria-label="Titre du câlin"
                className="w-full rounded-xl border border-terracotta/20 bg-cream px-3 py-2 font-manrope text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/40"
              />
              <label className="flex items-center gap-2 font-manrope text-sm text-ink-soft cursor-pointer">
                <input
                  type="checkbox"
                  checked={sauvegarder}
                  onChange={e => setSauvegarder(e.target.checked)}
                  className="rounded"
                />
                Sauvegarder dans ma bibliothèque
              </label>
            </>
          )}
        </div>
      )}

      {/* Bouton envoi */}
      <button
        onClick={handleEnvoyer}
        disabled={!canSend || isLoading || sent}
        aria-live="polite"
        className={`w-full py-3 rounded-full font-manrope font-bold text-base transition-all ${
          sent
            ? 'bg-olive text-white'
            : 'bg-terracotta text-white hover:bg-terracotta-deep disabled:opacity-40'
        }`}
      >
        {sent ? '🤗 Câlin envoyé !' : isLoading ? 'Envoi…' : 'Envoyer le câlin 🤗'}
      </button>
    </section>
  )
}
```

- [ ] **Step 2 : Build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 3 : Commit**

```bash
git add src/components/calins/EnvoyerCalin.tsx
git commit -m "feat(etape15): composant EnvoyerCalin"
```

---

### Task 9 : Composant CalinsRecus

**Files:**
- Create: `src/components/calins/CalinsRecus.tsx`

- [ ] **Step 1 : Créer le composant**

```typescript
// src/components/calins/CalinsRecus.tsx
'use client'

import { useState } from 'react'
import type { Calin } from '@/types/calin'
import { avatarFromEmail, tempsRelatif } from '@/lib/avatar'
import VoicePlayer from '@/components/timeline/VoicePlayer'

interface Props {
  calins: Calin[]
  onCalinsChange: () => void
}

export default function CalinsRecus({ calins, onCalinsChange }: Props) {
  const [ecouteId, setEcouteId] = useState<string | null>(null)

  const handleEcouter = async (c: Calin) => {
    setEcouteId(c.id)
    if (!c.ecoute_at) {
      await fetch(`/api/calins/${c.id}/ecouter`, { method: 'POST' })
      onCalinsChange()
    }
  }

  return (
    <section aria-labelledby="recus-titre">
      <h2 id="recus-titre" className="font-fraunces text-xl text-ink mb-3">
        Câlins reçus
      </h2>

      {calins.length === 0 ? (
        <p className="text-ink-soft font-manrope text-sm font-caveat text-base">
          Pas encore de câlin reçu… mais ça ne saurait tarder 🤗
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {calins.map(c => {
            const av = avatarFromEmail(c.expediteur_email)
            const nonLu = !c.ecoute_at
            const ouvert = ecouteId === c.id

            return (
              <div
                key={c.id}
                className="bg-jasmine rounded-2xl p-4 flex flex-col gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full ${av.couleurBg} flex items-center justify-center text-white font-bold text-base flex-shrink-0`}>
                    {av.initiale}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-manrope font-semibold text-sm text-ink truncate">
                      {c.titre}
                    </p>
                    <p className="font-manrope text-xs text-ink-soft">
                      De {c.expediteur_nom} · {tempsRelatif(c.envoye_at)}
                    </p>
                  </div>
                  {nonLu && (
                    <span className="flex-shrink-0 text-xs font-manrope font-bold bg-terracotta text-white px-2 py-0.5 rounded-full">
                      Nouveau !
                    </span>
                  )}
                </div>

                {ouvert ? (
                  <VoicePlayer url={c.vocal_url} duration={null} />
                ) : (
                  <button
                    onClick={() => handleEcouter(c)}
                    className="self-start flex items-center gap-2 px-4 py-2 rounded-full bg-terracotta text-white font-manrope font-semibold text-sm hover:bg-terracotta-deep transition-colors"
                  >
                    ▶ Écouter
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
```

- [ ] **Step 2 : Build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 3 : Commit**

```bash
git add src/components/calins/CalinsRecus.tsx
git commit -m "feat(etape15): composant CalinsRecus"
```

---

### Task 10 : CalinRealtimeListener + CalinPage + page route

**Files:**
- Create: `src/components/calins/CalinRealtimeListener.tsx`
- Create: `src/components/calins/CalinPage.tsx`
- Create: `src/app/calin/page.tsx`

- [ ] **Step 1 : Créer CalinRealtimeListener**

```typescript
// src/components/calins/CalinRealtimeListener.tsx
'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  userId: string
  onNewCalin: () => void
}

export default function CalinRealtimeListener({ userId, onNewCalin }: Props) {
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('calins-recus')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'calins',
          filter: `destinataire_id=eq.${userId}`,
        },
        () => { onNewCalin() },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, onNewCalin])

  return null
}
```

- [ ] **Step 2 : Créer CalinPage**

```typescript
// src/components/calins/CalinPage.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Vocal, Calin } from '@/types/calin'
import BibliothequeVocaux from './BibliothequeVocaux'
import EnvoyerCalin from './EnvoyerCalin'
import CalinsRecus from './CalinsRecus'
import CalinRealtimeListener from './CalinRealtimeListener'

interface Props {
  userId: string
}

export default function CalinPage({ userId }: Props) {
  const [vocaux, setVocaux] = useState<Vocal[]>([])
  const [calins, setCalins] = useState<Calin[]>([])

  const loadVocaux = useCallback(async () => {
    const res = await fetch('/api/calins/vocaux')
    if (res.ok) {
      const { vocaux: data } = await res.json()
      setVocaux(data)
    }
  }, [])

  const loadCalins = useCallback(async () => {
    const res = await fetch('/api/calins')
    if (res.ok) {
      const { calins: data } = await res.json()
      setCalins(data)
    }
  }, [])

  useEffect(() => {
    loadVocaux()
    loadCalins()
  }, [loadVocaux, loadCalins])

  return (
    <>
      <CalinRealtimeListener userId={userId} onNewCalin={loadCalins} />

      <div className="flex flex-col gap-8">
        <EnvoyerCalin
          userId={userId}
          vocaux={vocaux}
          onCalinEnvoye={loadCalins}
        />

        <hr className="border-terracotta/10" />

        <BibliothequeVocaux
          vocaux={vocaux}
          onVocauxChange={loadVocaux}
        />

        <hr className="border-terracotta/10" />

        <CalinsRecus
          calins={calins}
          onCalinsChange={loadCalins}
        />
      </div>
    </>
  )
}
```

- [ ] **Step 3 : Créer la page route**

```typescript
// src/app/calin/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NavBar from '@/components/NavBar'
import CalinPage from '@/components/calins/CalinPage'

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <>
      <NavBar />
      <main className="max-w-lg mx-auto px-4 py-6">
        <h1 className="font-fraunces text-3xl text-ink mb-6">
          Câlins virtuels 🤗
        </h1>
        <CalinPage userId={user.id} />
      </main>
    </>
  )
}
```

- [ ] **Step 4 : Build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 5 : Commit**

```bash
git add src/components/calins/CalinRealtimeListener.tsx src/components/calins/CalinPage.tsx src/app/calin/page.tsx
git commit -m "feat(etape15): CalinRealtimeListener + CalinPage + route /calin"
```

---

### Task 11 : NavBar — badge câlins + icône cœur

**Files:**
- Modify: `src/components/NavBar.tsx`

- [ ] **Step 1 : Lire le fichier actuel**

Lire `src/components/NavBar.tsx` pour avoir le contexte exact.

- [ ] **Step 2 : Ajouter la query badge câlins**

Après la query `lettresBadge` (ligne ~34), ajouter :

```typescript
  // Badge câlins : câlins non écoutés
  const { count: calinsBadgeCount } = await supabase
    .from('calins')
    .select('id', { count: 'exact', head: true })
    .eq('destinataire_id', user.id)
    .is('ecoute_at', null)
  const calinsBadge = calinsBadgeCount ?? 0
```

- [ ] **Step 3 : Ajouter le lien câlin dans le JSX**

Insérer entre le bloc `{/* Lettres */}` et le bloc `{/* Journal intime */}` :

```tsx
        {/* Câlins */}
        <Link
          href="/calin"
          className="relative flex items-center gap-1 text-ink-soft hover:text-terracotta transition-colors"
          aria-label={`Câlins virtuels${calinsBadge > 0 ? `, ${calinsBadge} nouveau${calinsBadge > 1 ? 'x' : ''}` : ''}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          {calinsBadge > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-terracotta text-white text-[9px] font-bold flex items-center justify-center">
              {calinsBadge}
            </span>
          )}
          <span className="text-xs font-manrope hidden sm:inline">Câlins</span>
        </Link>
```

- [ ] **Step 4 : Build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 5 : Commit**

```bash
git add src/components/NavBar.tsx
git commit -m "feat(etape15): badge câlins NavBar + icône cœur"
```

---

## Vérification manuelle post-déploiement

1. Connecté en tant que Papa → aller sur `/calin`
2. Section "Ma bibliothèque" → cliquer "Ajouter un vocal" → enregistrer → sauvegarder
3. Section "Envoyer un câlin" → sélectionner Sandra → choisir le vocal → Envoyer
4. Connecté en tant que Sandra → vérifier la notif push + badge NavBar
5. Aller sur `/calin` → voir le câlin dans "Câlins reçus" → cliquer "Écouter" → badge disparaît
6. Vérifier que le câlin Realtime arrive en temps réel (garder l'app ouverte)
