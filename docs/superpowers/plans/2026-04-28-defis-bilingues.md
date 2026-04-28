# Défis hebdomadaires + mots bilingues FR/AR — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre aux 3 membres de créer des défis (texte/photo) et des mots bilingues FR/AR (mini-quiz), visibles dans la timeline familiale et sur une page dédiée `/defis`.

**Architecture:** Table `defis` (type: 'defi' | 'mot') + table `reponses_defis` (texte/photo + flag `correct` pour les quiz). API routes Next.js 15 avec service role pour l'insert des réponses (écriture du champ `correct`). Intégration dans la Timeline existante : merge des 5 derniers défis avec les posts, triés par `created_at`.

**Tech Stack:** Next.js 15 App Router, TypeScript, Supabase (Storage bucket `defis` public, RLS, Realtime), Tailwind CSS, `src/lib/membres.ts` (membreById), `src/lib/avatar.ts` (avatarFromEmail, tempsRelatif)

**Prérequis manuels (avant de démarrer) :**
1. Créer le bucket Storage **`defis`** (public) dans Supabase Dashboard → Storage → New bucket → name: `defis`, public: ON
2. Exécuter `supabase/etape16-schema.sql` dans Supabase Dashboard → SQL Editor

---

## Structure des fichiers

**Nouveaux fichiers :**
- `supabase/etape16-schema.sql` — tables `defis` + `reponses_defis`, RLS, Realtime
- `src/types/defi.ts` — types `Defi` + `ReponseDefi`
- `src/app/api/defis/route.ts` — GET (liste + enrichissement) + POST (création)
- `src/app/api/defis/[id]/reponses/route.ts` — GET (liste réponses) + POST (répondre/tenter quiz)
- `src/components/defis/DefiCard.tsx` — carte défi dans la timeline
- `src/components/defis/MotCard.tsx` — carte mot bilingue avec quiz inline
- `src/components/defis/CreerDefi.tsx` — formulaire de création
- `src/components/defis/DefisPage.tsx` — page client `/defis`
- `src/app/defis/page.tsx` — Server Component auth guard

**Fichiers modifiés :**
- `src/components/timeline/Timeline.tsx` — ajout défis dans le feed + Realtime

---

### Task 1 : Schema SQL + types TypeScript

**Files:**
- Create: `supabase/etape16-schema.sql`
- Create: `src/types/defi.ts`

- [ ] **Step 1 : Créer le fichier SQL**

```sql
-- supabase/etape16-schema.sql
-- Étape 16 : Défis hebdomadaires + mots bilingues FR/AR

CREATE TABLE IF NOT EXISTS defis (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auteur_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type           TEXT NOT NULL CHECK (type IN ('defi', 'mot')),
  contenu        TEXT NOT NULL,
  traduction_ar  TEXT,
  indice         TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE defis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membres voient tous les défis"
  ON defis FOR SELECT
  USING (auth.uid() IN (
    'b6025d5f-77d5-4208-b489-bcc717ebc01c',
    '1a0967e9-91e0-48f6-a3da-752255274153',
    '617eff77-47ed-40e0-b784-c027183c9bee'
  ));

CREATE POLICY "Membres créent des défis"
  ON defis FOR INSERT
  WITH CHECK (auth.uid() = auteur_id);

CREATE POLICY "Auteur modifie son défi"
  ON defis FOR UPDATE
  USING (auth.uid() = auteur_id)
  WITH CHECK (auth.uid() = auteur_id);

CREATE POLICY "Auteur supprime son défi"
  ON defis FOR DELETE
  USING (auth.uid() = auteur_id);

CREATE TABLE IF NOT EXISTS reponses_defis (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  defi_id    UUID NOT NULL REFERENCES defis(id) ON DELETE CASCADE,
  auteur_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contenu    TEXT NOT NULL,
  photo_path TEXT,
  correct    BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (defi_id, auteur_id)
);

ALTER TABLE reponses_defis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membres voient toutes les réponses"
  ON reponses_defis FOR SELECT
  USING (auth.uid() IN (
    'b6025d5f-77d5-4208-b489-bcc717ebc01c',
    '1a0967e9-91e0-48f6-a3da-752255274153',
    '617eff77-47ed-40e0-b784-c027183c9bee'
  ));

CREATE POLICY "Membres créent leurs réponses"
  ON reponses_defis FOR INSERT
  WITH CHECK (auth.uid() = auteur_id);

CREATE POLICY "Auteur supprime sa réponse"
  ON reponses_defis FOR DELETE
  USING (auth.uid() = auteur_id);

-- INSERT et UPDATE du champ 'correct' via service role uniquement
ALTER PUBLICATION supabase_realtime ADD TABLE defis;
```

- [ ] **Step 2 : Créer les types TypeScript**

```typescript
// src/types/defi.ts

export interface ReponseDefi {
  id: string
  defi_id: string
  auteur_id: string
  auteur_nom: string
  auteur_email: string
  contenu: string
  photo_url: string | null
  correct: boolean | null
  created_at: string
}

export interface Defi {
  id: string
  auteur_id: string
  auteur_nom: string
  auteur_email: string
  type: 'defi' | 'mot'
  contenu: string
  traduction_ar: string | null
  indice: string | null
  created_at: string
  reponses: ReponseDefi[]
}
```

- [ ] **Step 3 : Build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 4 : Commit**

```bash
git add supabase/etape16-schema.sql src/types/defi.ts
git commit -m "feat(etape16): schema SQL + types Defi/ReponseDefi"
```

---

### Task 2 : API GET + POST /api/defis

**Files:**
- Create: `src/app/api/defis/route.ts`

- [ ] **Step 1 : Créer la route**

```typescript
// src/app/api/defis/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { membreById } from '@/lib/membres'

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

function photoUrl(path: string | null): string | null {
  if (!path) return null
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/defis/${path}`
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: rows, error } = await supabase
    .from('defis')
    .select('*, reponses_defis(*)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const defis = (rows ?? []).map(row => {
    const auteur = membreById(row.auteur_id)
    const reponses = ((row.reponses_defis as any[]) ?? []).map(r => {
      const rAuteur = membreById(r.auteur_id)
      return {
        id: r.id,
        defi_id: r.defi_id,
        auteur_id: r.auteur_id,
        auteur_nom: rAuteur?.nom ?? 'Inconnu',
        auteur_email: rAuteur?.email ?? '',
        contenu: r.contenu,
        photo_url: photoUrl(r.photo_path),
        correct: r.correct,
        created_at: r.created_at,
      }
    })
    return {
      id: row.id,
      auteur_id: row.auteur_id,
      auteur_nom: auteur?.nom ?? 'Inconnu',
      auteur_email: auteur?.email ?? '',
      type: row.type as 'defi' | 'mot',
      contenu: row.contenu,
      traduction_ar: row.traduction_ar ?? null,
      indice: row.indice ?? null,
      created_at: row.created_at,
      reponses,
    }
  })

  return NextResponse.json({ defis })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  let body: { type?: string; contenu?: string; traduction_ar?: string; indice?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  const { type, contenu, traduction_ar, indice } = body

  if (!type || !['defi', 'mot'].includes(type)) {
    return NextResponse.json({ error: 'type doit être "defi" ou "mot"' }, { status: 400 })
  }
  if (!contenu?.trim()) {
    return NextResponse.json({ error: 'contenu requis' }, { status: 400 })
  }
  if (type === 'mot' && !traduction_ar?.trim()) {
    return NextResponse.json({ error: 'traduction_ar requis pour un mot bilingue' }, { status: 400 })
  }

  const sc = serviceClient()
  const { data, error } = await sc
    .from('defis')
    .insert({
      auteur_id: user.id,
      type,
      contenu: contenu.trim(),
      traduction_ar: type === 'mot' ? traduction_ar!.trim() : null,
      indice: indice?.trim() || null,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ id: data.id }, { status: 201 })
}
```

- [ ] **Step 2 : Build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 3 : Commit**

```bash
git add src/app/api/defis/route.ts
git commit -m "feat(etape16): API GET+POST /api/defis"
```

---

### Task 3 : API GET + POST /api/defis/[id]/reponses

**Files:**
- Create: `src/app/api/defis/[id]/reponses/route.ts`

- [ ] **Step 1 : Créer la route**

```typescript
// src/app/api/defis/[id]/reponses/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { membreById } from '@/lib/membres'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']
const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

function photoUrl(path: string | null): string | null {
  if (!path) return null
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/defis/${path}`
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: rows, error } = await supabase
    .from('reponses_defis')
    .select('*')
    .eq('defi_id', id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const reponses = (rows ?? []).map(r => {
    const auteur = membreById(r.auteur_id)
    return {
      id: r.id,
      defi_id: r.defi_id,
      auteur_id: r.auteur_id,
      auteur_nom: auteur?.nom ?? 'Inconnu',
      auteur_email: auteur?.email ?? '',
      contenu: r.contenu,
      photo_url: photoUrl(r.photo_path),
      correct: r.correct,
      created_at: r.created_at,
    }
  })

  return NextResponse.json({ reponses })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: defiId } = await params
  if (!UUID_RE.test(defiId)) return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
  }

  const contenu = (formData.get('contenu') as string | null)?.trim()
  const photo = formData.get('photo') as File | null

  if (!contenu) return NextResponse.json({ error: 'contenu requis' }, { status: 400 })

  const sc = serviceClient()

  const { data: defi, error: defiError } = await sc
    .from('defis')
    .select('id, type, traduction_ar')
    .eq('id', defiId)
    .single()

  if (defiError || !defi) return NextResponse.json({ error: 'Défi introuvable' }, { status: 404 })

  const { data: existing } = await sc
    .from('reponses_defis')
    .select('id')
    .eq('defi_id', defiId)
    .eq('auteur_id', user.id)
    .maybeSingle()

  if (existing) return NextResponse.json({ error: 'Tu as déjà répondu à ce défi' }, { status: 409 })

  let photoPath: string | null = null
  if (photo && photo.size > 0 && defi.type === 'defi') {
    if (!ALLOWED_MIME.includes(photo.type)) {
      return NextResponse.json({ error: 'Format image non supporté (JPEG, PNG, WebP)' }, { status: 400 })
    }
    if (photo.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Image trop volumineuse (max 5 Mo)' }, { status: 400 })
    }
    const ext = EXT[photo.type]
    const uuid = crypto.randomUUID()
    photoPath = `reponses/${defiId}/${uuid}.${ext}`
    const { error: uploadError } = await sc.storage
      .from('defis')
      .upload(photoPath, photo, { contentType: photo.type })
    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  let correct: boolean | null = null
  if (defi.type === 'mot' && defi.traduction_ar) {
    correct = contenu.toLowerCase() === defi.traduction_ar.trim().toLowerCase()
  }

  const { data: inserted, error: insertError } = await sc
    .from('reponses_defis')
    .insert({ defi_id: defiId, auteur_id: user.id, contenu, photo_path: photoPath, correct })
    .select('id')
    .single()

  if (insertError) {
    if (photoPath) await sc.storage.from('defis').remove([photoPath])
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ id: inserted.id, correct }, { status: 201 })
}
```

- [ ] **Step 2 : Build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 3 : Commit**

```bash
git add src/app/api/defis/[id]/reponses/route.ts
git commit -m "feat(etape16): API GET+POST /api/defis/[id]/reponses"
```

---

### Task 4 : Composant DefiCard

**Files:**
- Create: `src/components/defis/DefiCard.tsx`

- [ ] **Step 1 : Créer le composant**

```typescript
// src/components/defis/DefiCard.tsx
'use client'

import { useState } from 'react'
import type { Defi } from '@/types/defi'
import { avatarFromEmail, tempsRelatif } from '@/lib/avatar'

interface Props {
  defi: Defi
  currentUserId: string
  onRepondu: () => void
}

export default function DefiCard({ defi, currentUserId, onRepondu }: Props) {
  const auteurAv = avatarFromEmail(defi.auteur_email)
  const maReponse = defi.reponses.find(r => r.auteur_id === currentUserId) ?? null
  const [contenu, setContenu] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!contenu.trim() && !photo) return
    setIsLoading(true)
    setErreur(null)
    try {
      const fd = new FormData()
      fd.append('contenu', contenu.trim() || '📷')
      if (photo) fd.append('photo', photo)
      const res = await fetch(`/api/defis/${defi.id}/reponses`, { method: 'POST', body: fd })
      if (!res.ok) {
        const { error } = await res.json()
        setErreur(error ?? 'Erreur lors de l\'envoi')
        return
      }
      onRepondu()
    } catch {
      setErreur('Erreur réseau')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-jasmine rounded-3xl p-4 mb-4 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div aria-hidden="true" className={`w-9 h-9 rounded-full ${auteurAv.couleurBg} flex items-center justify-center text-white font-bold text-base flex-shrink-0`}>
          {auteurAv.initiale}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-manrope font-semibold text-sm text-ink">{defi.auteur_nom}</p>
          <p className="font-manrope text-xs text-ink-soft">{tempsRelatif(defi.created_at)}</p>
        </div>
        <span className="text-xs font-manrope font-bold bg-terracotta/10 text-terracotta px-2 py-0.5 rounded-full">🎯 Défi</span>
      </div>

      <p className="font-manrope text-base text-ink mb-3">{defi.contenu}</p>

      {defi.reponses.length > 0 && (
        <div className="flex flex-col gap-2 mb-3">
          {defi.reponses.map(r => {
            const rAv = avatarFromEmail(r.auteur_email)
            return (
              <div key={r.id} className="flex items-start gap-2 bg-cream/70 rounded-xl p-2">
                <div aria-hidden="true" className={`w-7 h-7 rounded-full ${rAv.couleurBg} flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mt-0.5`}>
                  {rAv.initiale}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-manrope text-xs font-semibold text-ink">{r.auteur_nom}</p>
                  {r.contenu !== '📷' && <p className="font-manrope text-sm text-ink">{r.contenu}</p>}
                  {r.photo_url && (
                    <img
                      src={r.photo_url}
                      alt={`Réponse de ${r.auteur_nom}`}
                      className="mt-1 rounded-lg max-h-48 object-cover w-full"
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!maReponse ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={contenu}
            onChange={e => setContenu(e.target.value)}
            placeholder="Ta réponse…"
            rows={2}
            aria-label="Ta réponse au défi"
            className="w-full rounded-xl border border-terracotta/20 bg-cream px-3 py-2 font-manrope text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/40 resize-none"
          />
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 text-xs font-manrope text-ink-soft cursor-pointer">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={e => setPhoto(e.target.files?.[0] ?? null)}
              />
              <span className="px-2 py-1 rounded-lg bg-sand border border-terracotta/20 hover:bg-sand-warm transition-colors">
                📷 {photo ? photo.name.slice(0, 15) + '…' : 'Photo'}
              </span>
            </label>
            <button
              onClick={handleSubmit}
              disabled={isLoading || (!contenu.trim() && !photo)}
              className="ml-auto px-4 py-1.5 rounded-full bg-terracotta text-white font-manrope font-semibold text-sm hover:bg-terracotta-deep disabled:opacity-40 transition-colors"
            >
              {isLoading ? 'Envoi…' : 'Répondre'}
            </button>
          </div>
          {erreur && <p role="alert" className="text-xs text-red-600 font-manrope">{erreur}</p>}
        </div>
      ) : (
        <p className="font-manrope text-sm text-olive font-semibold">✓ Tu as répondu</p>
      )}
    </div>
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
git add src/components/defis/DefiCard.tsx
git commit -m "feat(etape16): composant DefiCard"
```

---

### Task 5 : Composant MotCard

**Files:**
- Create: `src/components/defis/MotCard.tsx`

- [ ] **Step 1 : Créer le composant**

```typescript
// src/components/defis/MotCard.tsx
'use client'

import { useState } from 'react'
import type { Defi } from '@/types/defi'
import { avatarFromEmail, tempsRelatif } from '@/lib/avatar'

interface Props {
  defi: Defi
  currentUserId: string
  onRepondu: () => void
}

export default function MotCard({ defi, currentUserId, onRepondu }: Props) {
  const auteurAv = avatarFromEmail(defi.auteur_email)
  const maReponse = defi.reponses.find(r => r.auteur_id === currentUserId) ?? null
  const [tentative, setTentative] = useState('')
  const [resultatLocal, setResultatLocal] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const handleVerifier = async () => {
    if (!tentative.trim()) return
    setIsLoading(true)
    setErreur(null)
    try {
      const fd = new FormData()
      fd.append('contenu', tentative.trim())
      const res = await fetch(`/api/defis/${defi.id}/reponses`, { method: 'POST', body: fd })
      if (!res.ok) {
        const { error } = await res.json()
        setErreur(error ?? 'Erreur lors de la vérification')
        return
      }
      const { correct } = await res.json()
      setResultatLocal(correct)
      onRepondu()
    } catch {
      setErreur('Erreur réseau')
    } finally {
      setIsLoading(false)
    }
  }

  const showResult = maReponse !== null || resultatLocal !== null
  const isCorrect = maReponse?.correct ?? resultatLocal
  const reponseText = maReponse?.contenu ?? tentative
  const autresReponses = defi.reponses.filter(r => r.auteur_id !== currentUserId)

  return (
    <div className="bg-jasmine rounded-3xl p-4 mb-4 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div aria-hidden="true" className={`w-9 h-9 rounded-full ${auteurAv.couleurBg} flex items-center justify-center text-white font-bold text-base flex-shrink-0`}>
          {auteurAv.initiale}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-manrope font-semibold text-sm text-ink">{defi.auteur_nom}</p>
          <p className="font-manrope text-xs text-ink-soft">{tempsRelatif(defi.created_at)}</p>
        </div>
        <span className="text-xs font-manrope font-bold bg-azur/10 text-azur-deep px-2 py-0.5 rounded-full">🔤 Mot</span>
      </div>

      <p className="font-fraunces text-2xl text-ink mb-1">{defi.contenu}</p>
      {defi.indice && (
        <p className="font-manrope text-xs text-ink-soft italic mb-3">Indice : {defi.indice}</p>
      )}

      {showResult ? (
        <div className={`rounded-xl p-3 mb-3 ${isCorrect ? 'bg-olive/10' : 'bg-terracotta/10'}`}>
          <p className="font-manrope text-sm font-semibold text-ink mb-1">
            {isCorrect ? '✅ Bravo !' : '❌ Pas tout à fait…'}
          </p>
          <p className="font-manrope text-sm text-ink-soft">
            Ta réponse : <span className="text-ink">{reponseText}</span>
          </p>
          {!isCorrect && defi.traduction_ar && (
            <p className="font-manrope text-sm text-ink-soft mt-1">
              Bonne réponse : <span className="font-semibold text-ink" dir="rtl">{defi.traduction_ar}</span>
            </p>
          )}
          {isCorrect && defi.traduction_ar && (
            <p className="font-manrope text-sm text-ink" dir="rtl">{defi.traduction_ar}</p>
          )}
        </div>
      ) : (
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={tentative}
            onChange={e => setTentative(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleVerifier()}
            placeholder="Traduction en arabe…"
            aria-label="Ta réponse en arabe"
            dir="auto"
            className="flex-1 rounded-xl border border-terracotta/20 bg-cream px-3 py-2 font-manrope text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/40"
          />
          <button
            onClick={handleVerifier}
            disabled={isLoading || !tentative.trim()}
            className="px-4 py-2 rounded-full bg-azur text-white font-manrope font-semibold text-sm hover:bg-azur-deep disabled:opacity-40 transition-colors"
          >
            {isLoading ? '…' : 'Vérifier'}
          </button>
        </div>
      )}

      {erreur && <p role="alert" className="text-xs text-red-600 font-manrope mb-2">{erreur}</p>}

      {autresReponses.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          {autresReponses.map(r => {
            const av = avatarFromEmail(r.auteur_email)
            return (
              <span key={r.id} className="flex items-center gap-1 text-xs font-manrope text-ink-soft">
                <span aria-hidden="true" className={`w-5 h-5 rounded-full ${av.couleurBg} flex items-center justify-center text-white font-bold text-[10px]`}>
                  {av.initiale}
                </span>
                {r.correct === true ? '✅' : r.correct === false ? '❌' : '—'}
              </span>
            )
          })}
        </div>
      )}
    </div>
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
git add src/components/defis/MotCard.tsx
git commit -m "feat(etape16): composant MotCard"
```

---

### Task 6 : Composant CreerDefi

**Files:**
- Create: `src/components/defis/CreerDefi.tsx`

- [ ] **Step 1 : Créer le composant**

```typescript
// src/components/defis/CreerDefi.tsx
'use client'

import { useState } from 'react'

interface Props {
  onCree: () => void
  onAnnuler: () => void
}

export default function CreerDefi({ onCree, onAnnuler }: Props) {
  const [type, setType] = useState<'defi' | 'mot'>('defi')
  const [contenu, setContenu] = useState('')
  const [traductionAr, setTraductionAr] = useState('')
  const [indice, setIndice] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const handleTypeChange = (t: 'defi' | 'mot') => {
    setType(t)
    setContenu('')
    setTraductionAr('')
    setIndice('')
    setErreur(null)
  }

  const handlePublier = async () => {
    if (!contenu.trim()) return
    if (type === 'mot' && !traductionAr.trim()) return
    setIsLoading(true)
    setErreur(null)
    try {
      const res = await fetch('/api/defis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          contenu: contenu.trim(),
          traduction_ar: type === 'mot' ? traductionAr.trim() : undefined,
          indice: indice.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const { error } = await res.json()
        setErreur(error ?? 'Erreur lors de la création')
        return
      }
      onCree()
    } catch {
      setErreur('Erreur réseau')
    } finally {
      setIsLoading(false)
    }
  }

  const canSubmit = contenu.trim() && (type !== 'mot' || traductionAr.trim())

  return (
    <div className="bg-jasmine rounded-3xl p-4 mb-4 border-2 border-terracotta/20">
      <h2 className="font-fraunces text-lg text-ink mb-3">Créer un défi</h2>

      <div className="flex gap-2 mb-4" role="radiogroup" aria-label="Type de contenu">
        {(['defi', 'mot'] as const).map(t => (
          <button
            key={t}
            role="radio"
            aria-checked={type === t}
            onClick={() => handleTypeChange(t)}
            className={`flex-1 py-2 rounded-full font-manrope font-semibold text-sm transition-all ${
              type === t
                ? 'bg-terracotta text-white'
                : 'bg-cream text-ink-soft border border-terracotta/20 hover:border-terracotta/40'
            }`}
          >
            {t === 'defi' ? '🎯 Défi' : '🔤 Mot bilingue'}
          </button>
        ))}
      </div>

      {type === 'defi' ? (
        <textarea
          value={contenu}
          onChange={e => setContenu(e.target.value)}
          placeholder="Décris le défi… (ex: Dessine un souvenir de cette semaine)"
          rows={3}
          aria-label="Description du défi"
          className="w-full rounded-xl border border-terracotta/20 bg-cream px-3 py-2 font-manrope text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/40 resize-none mb-3"
        />
      ) : (
        <div className="flex flex-col gap-2 mb-3">
          <input
            type="text"
            value={contenu}
            onChange={e => setContenu(e.target.value)}
            placeholder="Mot en français (ex: papillon)"
            aria-label="Mot en français"
            className="w-full rounded-xl border border-terracotta/20 bg-cream px-3 py-2 font-manrope text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/40"
          />
          <input
            type="text"
            value={traductionAr}
            onChange={e => setTraductionAr(e.target.value)}
            placeholder="Traduction en arabe"
            aria-label="Traduction en arabe"
            dir="auto"
            className="w-full rounded-xl border border-terracotta/20 bg-cream px-3 py-2 font-manrope text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/40"
          />
          <input
            type="text"
            value={indice}
            onChange={e => setIndice(e.target.value)}
            placeholder="Indice (optionnel)"
            aria-label="Indice optionnel"
            className="w-full rounded-xl border border-terracotta/20 bg-cream px-3 py-2 font-manrope text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/40"
          />
        </div>
      )}

      {erreur && <p role="alert" className="text-xs text-red-600 font-manrope mb-2">{erreur}</p>}

      <div className="flex gap-2">
        <button
          onClick={onAnnuler}
          className="flex-1 py-2 rounded-full border border-terracotta/20 font-manrope text-sm text-ink-soft hover:bg-sand transition-colors"
        >
          Annuler
        </button>
        <button
          onClick={handlePublier}
          disabled={isLoading || !canSubmit}
          className="flex-1 py-2 rounded-full bg-terracotta text-white font-manrope font-semibold text-sm hover:bg-terracotta-deep disabled:opacity-40 transition-colors"
        >
          {isLoading ? 'Publication…' : 'Publier'}
        </button>
      </div>
    </div>
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
git add src/components/defis/CreerDefi.tsx
git commit -m "feat(etape16): composant CreerDefi"
```

---

### Task 7 : DefisPage + page route

**Files:**
- Create: `src/components/defis/DefisPage.tsx`
- Create: `src/app/defis/page.tsx`

- [ ] **Step 1 : Créer DefisPage**

```typescript
// src/components/defis/DefisPage.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Defi } from '@/types/defi'
import DefiCard from './DefiCard'
import MotCard from './MotCard'
import CreerDefi from './CreerDefi'

interface Props {
  userId: string
}

export default function DefisPage({ userId }: Props) {
  const [defis, setDefis] = useState<Defi[]>([])
  const [showCreer, setShowCreer] = useState(false)

  const loadDefis = useCallback(async () => {
    const res = await fetch('/api/defis')
    if (res.ok) {
      const { defis: data } = await res.json()
      setDefis(data)
    }
  }, [])

  useEffect(() => { loadDefis() }, [loadDefis])

  return (
    <div className="min-h-screen bg-cream pb-32">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-fraunces text-2xl text-ink">Défis & Mots 🎯</h1>
          <button
            onClick={() => setShowCreer(v => !v)}
            className="px-4 py-2 rounded-full bg-terracotta text-white font-manrope font-semibold text-sm hover:bg-terracotta-deep transition-colors"
          >
            {showCreer ? 'Annuler' : '+ Créer'}
          </button>
        </div>

        {showCreer && (
          <CreerDefi
            onCree={() => { setShowCreer(false); loadDefis() }}
            onAnnuler={() => setShowCreer(false)}
          />
        )}

        {defis.length === 0 && !showCreer ? (
          <p className="font-caveat text-center text-ink-soft text-xl mt-16">
            Pas encore de défi… soyez créatifs ! 🎯
          </p>
        ) : (
          defis.map(d =>
            d.type === 'mot' ? (
              <MotCard key={d.id} defi={d} currentUserId={userId} onRepondu={loadDefis} />
            ) : (
              <DefiCard key={d.id} defi={d} currentUserId={userId} onRepondu={loadDefis} />
            )
          )
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2 : Créer la page route**

```typescript
// src/app/defis/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NavBar from '@/components/NavBar'
import DefisPage from '@/components/defis/DefisPage'

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <>
      <NavBar />
      <DefisPage userId={user.id} />
    </>
  )
}
```

- [ ] **Step 3 : Build**

```bash
npm run build
```

Expected: `/defis` apparaît dans la liste des routes dynamiques.

- [ ] **Step 4 : Commit**

```bash
git add src/components/defis/DefisPage.tsx src/app/defis/page.tsx
git commit -m "feat(etape16): DefisPage + route /defis"
```

---

### Task 8 : Intégration Timeline

**Files:**
- Modify: `src/components/timeline/Timeline.tsx`

La Timeline existante reçoit des `Post[]` et affiche les `PostCard`. Il faut y ajouter un état `defis`, un fetch depuis `/api/defis`, une subscription Realtime sur la table `defis`, et le rendu de `DefiCard`/`MotCard` dans le feed fusionné. La page `src/app/page.tsx` n'a pas besoin d'être modifiée — la Timeline gère son propre fetch des défis côté client.

- [ ] **Step 1 : Lire le fichier actuel**

Lire `src/components/timeline/Timeline.tsx` pour avoir le contexte exact avant modification.

- [ ] **Step 2 : Remplacer le contenu de Timeline.tsx**

```typescript
// src/components/timeline/Timeline.tsx
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import PostCard from './PostCard'
import DefiCard from '@/components/defis/DefiCard'
import MotCard from '@/components/defis/MotCard'
import ComposeBar from './ComposeBar'
import type { Post, CurrentUser } from '@/types/post'
import type { Defi } from '@/types/defi'

interface TimelineProps {
  initialPosts: Post[]
  currentUser: CurrentUser
  supabaseUrl: string
  supabaseAnonKey: string
}

type FeedItem =
  | { kind: 'post'; id: string; created_at: string; data: Post }
  | { kind: 'defi'; id: string; created_at: string; data: Defi }

export default function Timeline({
  initialPosts,
  currentUser,
  supabaseUrl,
  supabaseAnonKey,
}: TimelineProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [defis, setDefis] = useState<Defi[]>([])

  const supabase = useMemo(
    () => createBrowserClient(supabaseUrl, supabaseAnonKey),
    [supabaseUrl, supabaseAnonKey]
  )

  const fetchPosts = useCallback(async () => {
    const { data } = await supabase
      .from('posts')
      .select('*, reactions(*), profiles(email, nom)')
      .order('created_at', { ascending: false })
      .limit(50)
    if (data) setPosts(data as Post[])
  }, [supabase])

  const fetchDefis = useCallback(async () => {
    const res = await fetch('/api/defis')
    if (res.ok) {
      const { defis: data } = await res.json()
      setDefis((data as Defi[]).slice(0, 5))
    }
  }, [])

  useEffect(() => {
    fetchPosts()
    fetchDefis()

    const channel = supabase
      .channel('timeline')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => fetchPosts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reactions' }, () => fetchPosts())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'defis' }, () => fetchDefis())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase, fetchPosts, fetchDefis])

  const feedItems: FeedItem[] = useMemo(() => [
    ...posts.map(p => ({ kind: 'post' as const, id: p.id, created_at: p.created_at, data: p })),
    ...defis.map(d => ({ kind: 'defi' as const, id: d.id, created_at: d.created_at, data: d })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()), [posts, defis])

  return (
    <div className="min-h-screen bg-cream pb-32">
      <h1 className="font-fraunces italic text-terracotta text-center text-2xl pt-8 pb-4">
        La famille Khedhiri ♡
      </h1>

      <div className="mx-auto max-w-lg px-4">
        {feedItems.length > 0 ? (
          feedItems.map(item =>
            item.kind === 'post' ? (
              <PostCard key={`post-${item.id}`} post={item.data} currentUser={currentUser} />
            ) : item.data.type === 'mot' ? (
              <MotCard key={`defi-${item.id}`} defi={item.data} currentUserId={currentUser.id} onRepondu={fetchDefis} />
            ) : (
              <DefiCard key={`defi-${item.id}`} defi={item.data} currentUserId={currentUser.id} onRepondu={fetchDefis} />
            )
          )
        ) : (
          <p className="font-caveat text-center text-ink-soft text-xl mt-16">
            Soyez les premiers à partager quelque chose ♡
          </p>
        )}

        {defis.length > 0 && (
          <div className="text-center mt-4 mb-8">
            <Link
              href="/defis"
              className="font-manrope text-sm text-terracotta hover:text-terracotta-deep underline underline-offset-2 transition-colors"
            >
              Voir tous les défis →
            </Link>
          </div>
        )}
      </div>

      <ComposeBar onPosted={fetchPosts} />
    </div>
  )
}
```

- [ ] **Step 3 : Build**

```bash
npm run build
```

Expected: no errors. La route `/defis` et `/` compilent sans erreur TypeScript.

- [ ] **Step 4 : Commit**

```bash
git add src/components/timeline/Timeline.tsx
git commit -m "feat(etape16): intégration défis dans la Timeline + lien /defis"
```

---

## Vérification manuelle post-déploiement

1. Connecté en tant que Papa → aller sur `/defis`
2. Créer un **mot bilingue** : "papillon" → "فراشة" → Indice : "commence par un ف"
3. Connecté en tant que Sandra → voir le mot sur la timeline + `/defis`
4. Sandra tape "فراشة" → vérifier → ✅ Bravo !
5. Connecté en tant que Sarah → taper une mauvaise réponse → ❌ + révèle la bonne réponse
6. Créer un **défi** : "Dessine ce que tu ferais si tu pouvais voler ✈️"
7. Sandra répond avec un texte + optionnellement une photo
8. Vérifier que le défi apparaît dans la timeline avec les réponses
9. Vérifier le lien "Voir tous les défis →" pointe vers `/defis`
