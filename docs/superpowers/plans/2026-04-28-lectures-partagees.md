# Lectures partagées + défis éducatifs — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre aux 3 membres de proposer des livres, de suivre leur avancement individuel (pas commencé / en cours / terminé) et de poster des questions/défis éducatifs par livre, le tout intégré dans la page `/defis` existante.

**Architecture:** Section "Lectures 📚" ajoutée à `DefisPage` via un composant `LecturesSection`. 4 nouvelles tables Supabase (`lectures`, `avancement_lecture`, `questions_lecture`, `reponses_questions`). 7 API routes (CRUD + proxy Google Books). Recherche Google Books sans clé API (public endpoint). Questions chargées en lazy-load au premier clic.

**Tech Stack:** Next.js 15 App Router, TypeScript, Supabase (RLS + service role), Tailwind CSS, `@/lib/membres` (`MEMBRES` array + `membreById`), `@/lib/avatar` (`avatarFromEmail`, `tempsRelatif`)

**Prérequis manuels :** Exécuter `supabase/etape17-schema.sql` dans Supabase Dashboard → SQL Editor.

---

## Structure des fichiers

**Nouveaux fichiers :**
- `supabase/etape17-schema.sql` — tables + RLS + Realtime publication
- `src/types/lecture.ts` — types `Lecture`, `AvancementMembre`, `QuestionLecture`, `ReponseQuestion`, `GoogleBooksResult`
- `src/app/api/lectures/route.ts` — GET (liste enrichie) + POST (création)
- `src/app/api/google-books/route.ts` — GET proxy Google Books API
- `src/app/api/lectures/[id]/avancement/route.ts` — PATCH UPSERT avancement
- `src/app/api/lectures/[id]/questions/route.ts` — GET (liste lazy) + POST (création question)
- `src/app/api/lectures/[id]/questions/[qid]/reponses/route.ts` — POST réponse
- `src/components/lectures/QuestionCard.tsx` — question + réponses inline
- `src/components/lectures/PosterQuestion.tsx` — formulaire inline nouvelle question
- `src/components/lectures/LectureCard.tsx` — carte livre avec avancement + questions dépliables
- `src/components/lectures/AjouterLecture.tsx` — formulaire création avec search Google Books
- `src/components/lectures/LecturesSection.tsx` — composant racine de la section

**Fichiers modifiés :**
- `src/components/defis/DefisPage.tsx` — ajout de `<LecturesSection>` en deuxième section

---

### Task 1 : Schema SQL + types TypeScript

**Files:**
- Create: `supabase/etape17-schema.sql`
- Create: `src/types/lecture.ts`

- [ ] **Step 1 : Créer le fichier SQL**

```sql
-- supabase/etape17-schema.sql
-- Étape 17 : Lectures partagées + défis éducatifs

CREATE TABLE IF NOT EXISTS lectures (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auteur_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titre          TEXT NOT NULL,
  auteur_livre   TEXT NOT NULL,
  description    TEXT,
  couverture_url TEXT,
  assignees      UUID[] NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE lectures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membres voient toutes les lectures"
  ON lectures FOR SELECT
  USING (auth.uid() IN (
    'b6025d5f-77d5-4208-b489-bcc717ebc01c',
    '1a0967e9-91e0-48f6-a3da-752255274153',
    '617eff77-47ed-40e0-b784-c027183c9bee'
  ));

CREATE POLICY "Auteur modifie sa lecture"
  ON lectures FOR UPDATE
  USING (auth.uid() = auteur_id)
  WITH CHECK (auth.uid() = auteur_id);

CREATE POLICY "Auteur supprime sa lecture"
  ON lectures FOR DELETE
  USING (auth.uid() = auteur_id);

-- INSERT via service role uniquement

CREATE TABLE IF NOT EXISTS avancement_lecture (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_id UUID NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
  membre_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  statut     TEXT NOT NULL CHECK (statut IN ('pas_commence', 'en_cours', 'termine')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (lecture_id, membre_id)
);

ALTER TABLE avancement_lecture ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membres voient tous les avancements"
  ON avancement_lecture FOR SELECT
  USING (auth.uid() IN (
    'b6025d5f-77d5-4208-b489-bcc717ebc01c',
    '1a0967e9-91e0-48f6-a3da-752255274153',
    '617eff77-47ed-40e0-b784-c027183c9bee'
  ));

CREATE POLICY "Auteur supprime son avancement"
  ON avancement_lecture FOR DELETE
  USING (auth.uid() = membre_id);

-- INSERT et UPDATE via service role uniquement

CREATE TABLE IF NOT EXISTS questions_lecture (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_id UUID NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
  auteur_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contenu    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE questions_lecture ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membres voient toutes les questions"
  ON questions_lecture FOR SELECT
  USING (auth.uid() IN (
    'b6025d5f-77d5-4208-b489-bcc717ebc01c',
    '1a0967e9-91e0-48f6-a3da-752255274153',
    '617eff77-47ed-40e0-b784-c027183c9bee'
  ));

CREATE POLICY "Auteur supprime sa question"
  ON questions_lecture FOR DELETE
  USING (auth.uid() = auteur_id);

-- INSERT via service role uniquement

CREATE TABLE IF NOT EXISTS reponses_questions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions_lecture(id) ON DELETE CASCADE,
  auteur_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contenu     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (question_id, auteur_id)
);

ALTER TABLE reponses_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membres voient toutes les réponses"
  ON reponses_questions FOR SELECT
  USING (auth.uid() IN (
    'b6025d5f-77d5-4208-b489-bcc717ebc01c',
    '1a0967e9-91e0-48f6-a3da-752255274153',
    '617eff77-47ed-40e0-b784-c027183c9bee'
  ));

CREATE POLICY "Auteur supprime sa réponse"
  ON reponses_questions FOR DELETE
  USING (auth.uid() = auteur_id);

-- INSERT via service role uniquement

ALTER PUBLICATION supabase_realtime ADD TABLE lectures;
```

- [ ] **Step 2 : Créer les types TypeScript**

```typescript
// src/types/lecture.ts

export interface AvancementMembre {
  membre_id: string
  membre_nom: string
  membre_email: string
  statut: 'pas_commence' | 'en_cours' | 'termine'
}

export interface ReponseQuestion {
  id: string
  question_id: string
  auteur_id: string
  auteur_nom: string
  auteur_email: string
  contenu: string
  created_at: string
}

export interface QuestionLecture {
  id: string
  lecture_id: string
  auteur_id: string
  auteur_nom: string
  auteur_email: string
  contenu: string
  created_at: string
  reponses: ReponseQuestion[]
}

export interface Lecture {
  id: string
  auteur_id: string
  auteur_nom: string
  auteur_email: string
  titre: string
  auteur_livre: string
  description: string | null
  couverture_url: string | null
  assignees: string[]
  created_at: string
  avancements: AvancementMembre[]
  nb_questions: number
}

export interface GoogleBooksResult {
  titre: string
  auteur: string
  description: string | null
  couverture_url: string | null
}
```

- [ ] **Step 3 : Build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 4 : Commit**

```bash
git add supabase/etape17-schema.sql src/types/lecture.ts
git commit -m "feat(etape17): schema SQL + types Lecture/QuestionLecture"
```

---

### Task 2 : API GET + POST /api/lectures + GET /api/google-books

**Files:**
- Create: `src/app/api/lectures/route.ts`
- Create: `src/app/api/google-books/route.ts`

- [ ] **Step 1 : Créer `src/app/api/lectures/route.ts`**

```typescript
// src/app/api/lectures/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { membreById, MEMBRES } from '@/lib/membres'

type RawAvancement = {
  membre_id: string
  statut: string
  updated_at: string
}

type RawQuestion = { id: string }

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

  const { data: rows, error } = await supabase
    .from('lectures')
    .select('*, avancement_lecture(*), questions_lecture(id)')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const lectures = (rows ?? []).map(row => {
    const auteur = membreById(row.auteur_id)
    const rawAvancements = (row.avancement_lecture as RawAvancement[]) ?? []
    const avancements = MEMBRES.map(m => {
      const found = rawAvancements.find(a => a.membre_id === m.id)
      return {
        membre_id: m.id,
        membre_nom: m.nom,
        membre_email: m.email,
        statut: (found?.statut ?? 'pas_commence') as 'pas_commence' | 'en_cours' | 'termine',
      }
    })
    return {
      id: row.id,
      auteur_id: row.auteur_id,
      auteur_nom: auteur?.nom ?? 'Inconnu',
      auteur_email: auteur?.email ?? '',
      titre: row.titre,
      auteur_livre: row.auteur_livre,
      description: row.description ?? null,
      couverture_url: row.couverture_url ?? null,
      assignees: row.assignees ?? [],
      created_at: row.created_at,
      avancements,
      nb_questions: ((row.questions_lecture as RawQuestion[]) ?? []).length,
    }
  })

  return NextResponse.json({ lectures })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  let body: {
    titre?: string
    auteur_livre?: string
    description?: string
    couverture_url?: string
    assignees?: string[]
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  const { titre, auteur_livre, description, couverture_url, assignees } = body

  if (!titre?.trim()) return NextResponse.json({ error: 'titre requis' }, { status: 400 })
  if (!auteur_livre?.trim()) return NextResponse.json({ error: 'auteur_livre requis' }, { status: 400 })

  const sc = serviceClient()
  const { data, error } = await sc
    .from('lectures')
    .insert({
      auteur_id: user.id,
      titre: titre.trim(),
      auteur_livre: auteur_livre.trim(),
      description: description?.trim() || null,
      couverture_url: couverture_url?.trim() || null,
      assignees: assignees ?? [],
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id }, { status: 201 })
}
```

- [ ] **Step 2 : Créer `src/app/api/google-books/route.ts`**

```typescript
// src/app/api/google-books/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()
  if (!q) return NextResponse.json({ results: [] })

  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=5&langRestrict=fr`
    const res = await fetch(url, { next: { revalidate: 0 } })
    if (!res.ok) return NextResponse.json({ results: [] })

    const data = await res.json()
    const results = ((data.items ?? []) as any[]).map(item => ({
      titre: item.volumeInfo?.title ?? '',
      auteur: ((item.volumeInfo?.authors ?? []) as string[]).join(', '),
      description: item.volumeInfo?.description ?? null,
      couverture_url: item.volumeInfo?.imageLinks?.thumbnail?.replace('http://', 'https://') ?? null,
    }))

    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ results: [] })
  }
}
```

- [ ] **Step 3 : Build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 4 : Commit**

```bash
git add src/app/api/lectures/route.ts src/app/api/google-books/route.ts
git commit -m "feat(etape17): API GET+POST /api/lectures + proxy Google Books"
```

---

### Task 3 : API PATCH /api/lectures/[id]/avancement

**Files:**
- Create: `src/app/api/lectures/[id]/avancement/route.ts`

- [ ] **Step 1 : Créer la route**

```typescript
// src/app/api/lectures/[id]/avancement/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: lectureId } = await params
  if (!UUID_RE.test(lectureId)) return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  let body: { statut?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  const { statut } = body
  if (!statut || !['pas_commence', 'en_cours', 'termine'].includes(statut)) {
    return NextResponse.json({ error: 'statut invalide — valeurs acceptées : pas_commence, en_cours, termine' }, { status: 400 })
  }

  const sc = serviceClient()
  const { error } = await sc
    .from('avancement_lecture')
    .upsert(
      { lecture_id: lectureId, membre_id: user.id, statut, updated_at: new Date().toISOString() },
      { onConflict: 'lecture_id,membre_id' },
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
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
git add "src/app/api/lectures/[id]/avancement/route.ts"
git commit -m "feat(etape17): API PATCH /api/lectures/[id]/avancement"
```

---

### Task 4 : API questions + réponses

**Files:**
- Create: `src/app/api/lectures/[id]/questions/route.ts`
- Create: `src/app/api/lectures/[id]/questions/[qid]/reponses/route.ts`

- [ ] **Step 1 : Créer `src/app/api/lectures/[id]/questions/route.ts`**

```typescript
// src/app/api/lectures/[id]/questions/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { membreById } from '@/lib/membres'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type RawReponse = {
  id: string
  question_id: string
  auteur_id: string
  contenu: string
  created_at: string
}

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: lectureId } = await params
  if (!UUID_RE.test(lectureId)) return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: rows, error } = await supabase
    .from('questions_lecture')
    .select('*, reponses_questions(*)')
    .eq('lecture_id', lectureId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const questions = (rows ?? []).map(row => {
    const auteur = membreById(row.auteur_id)
    const reponses = ((row.reponses_questions as RawReponse[]) ?? []).map(r => {
      const rAuteur = membreById(r.auteur_id)
      return {
        id: r.id,
        question_id: r.question_id,
        auteur_id: r.auteur_id,
        auteur_nom: rAuteur?.nom ?? 'Inconnu',
        auteur_email: rAuteur?.email ?? '',
        contenu: r.contenu,
        created_at: r.created_at,
      }
    })
    return {
      id: row.id,
      lecture_id: row.lecture_id,
      auteur_id: row.auteur_id,
      auteur_nom: auteur?.nom ?? 'Inconnu',
      auteur_email: auteur?.email ?? '',
      contenu: row.contenu,
      created_at: row.created_at,
      reponses,
    }
  })

  return NextResponse.json({ questions })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: lectureId } = await params
  if (!UUID_RE.test(lectureId)) return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  let body: { contenu?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  if (!body.contenu?.trim()) return NextResponse.json({ error: 'contenu requis' }, { status: 400 })

  const sc = serviceClient()
  const { data, error } = await sc
    .from('questions_lecture')
    .insert({ lecture_id: lectureId, auteur_id: user.id, contenu: body.contenu.trim() })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id }, { status: 201 })
}
```

- [ ] **Step 2 : Créer `src/app/api/lectures/[id]/questions/[qid]/reponses/route.ts`**

```typescript
// src/app/api/lectures/[id]/questions/[qid]/reponses/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; qid: string }> },
) {
  const { id: lectureId, qid: questionId } = await params
  if (!UUID_RE.test(lectureId) || !UUID_RE.test(questionId)) {
    return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  let body: { contenu?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  if (!body.contenu?.trim()) return NextResponse.json({ error: 'contenu requis' }, { status: 400 })

  const sc = serviceClient()

  const { data: existing } = await sc
    .from('reponses_questions')
    .select('id')
    .eq('question_id', questionId)
    .eq('auteur_id', user.id)
    .maybeSingle()

  if (existing) return NextResponse.json({ error: 'Tu as déjà répondu à cette question' }, { status: 409 })

  const { data, error } = await sc
    .from('reponses_questions')
    .insert({ question_id: questionId, auteur_id: user.id, contenu: body.contenu.trim() })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id }, { status: 201 })
}
```

- [ ] **Step 3 : Build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 4 : Commit**

```bash
git add "src/app/api/lectures/[id]/questions/route.ts" "src/app/api/lectures/[id]/questions/[qid]/reponses/route.ts"
git commit -m "feat(etape17): API GET+POST questions + POST réponses"
```

---

### Task 5 : Composants QuestionCard + PosterQuestion

**Files:**
- Create: `src/components/lectures/QuestionCard.tsx`
- Create: `src/components/lectures/PosterQuestion.tsx`

- [ ] **Step 1 : Créer `src/components/lectures/QuestionCard.tsx`**

```typescript
// src/components/lectures/QuestionCard.tsx
'use client'

import { useState } from 'react'
import type { QuestionLecture } from '@/types/lecture'
import { avatarFromEmail, tempsRelatif } from '@/lib/avatar'

interface Props {
  question: QuestionLecture
  lectureId: string
  currentUserId: string
  onRepondu: () => void
}

export default function QuestionCard({ question, lectureId, currentUserId, onRepondu }: Props) {
  const auteurAv = avatarFromEmail(question.auteur_email)
  const maReponse = question.reponses.find(r => r.auteur_id === currentUserId) ?? null
  const [contenu, setContenu] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const handleRepondre = async () => {
    if (!contenu.trim()) return
    setIsLoading(true)
    setErreur(null)
    try {
      const res = await fetch(
        `/api/lectures/${lectureId}/questions/${question.id}/reponses`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contenu: contenu.trim() }),
        },
      )
      if (!res.ok) {
        const { error } = await res.json()
        setErreur(error ?? 'Erreur lors de l\'envoi')
        return
      }
      setContenu('')
      onRepondu()
    } catch {
      setErreur('Erreur réseau')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-cream/80 rounded-xl p-3 mb-2">
      <div className="flex items-center gap-2 mb-2">
        <div aria-hidden="true" className={`w-7 h-7 rounded-full ${auteurAv.couleurBg} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
          {auteurAv.initiale}
        </div>
        <div className="flex-1 min-w-0">
          <span className="font-manrope font-semibold text-xs text-ink">{question.auteur_nom}</span>
          <span className="font-manrope text-xs text-ink-soft ml-2">{tempsRelatif(question.created_at)}</span>
        </div>
      </div>

      <p className="font-manrope text-sm text-ink mb-2">{question.contenu}</p>

      {question.reponses.length > 0 && (
        <div className="flex flex-col gap-1 mb-2 pl-3 border-l-2 border-terracotta/20">
          {question.reponses.map(r => {
            const rAv = avatarFromEmail(r.auteur_email)
            return (
              <div key={r.id} className="flex items-start gap-2">
                <div aria-hidden="true" className={`w-5 h-5 rounded-full ${rAv.couleurBg} flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0 mt-0.5`}>
                  {rAv.initiale}
                </div>
                <p className="font-manrope text-xs text-ink">{r.contenu}</p>
              </div>
            )
          })}
        </div>
      )}

      {!maReponse ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={contenu}
            onChange={e => setContenu(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRepondre()}
            placeholder="Ta réponse…"
            aria-label="Ta réponse à la question"
            className="flex-1 rounded-lg border border-terracotta/20 bg-cream px-3 py-1.5 font-manrope text-xs text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/40"
          />
          <button
            type="button"
            onClick={handleRepondre}
            disabled={isLoading || !contenu.trim()}
            className="px-3 py-1.5 rounded-lg bg-terracotta text-white font-manrope font-semibold text-xs hover:bg-terracotta-deep disabled:opacity-40 transition-colors"
          >
            {isLoading ? '…' : 'Répondre'}
          </button>
        </div>
      ) : (
        <p className="font-manrope text-xs text-olive font-semibold">✓ Tu as répondu</p>
      )}
      {erreur && <p role="alert" className="text-xs text-red-600 font-manrope mt-1">{erreur}</p>}
    </div>
  )
}
```

- [ ] **Step 2 : Créer `src/components/lectures/PosterQuestion.tsx`**

```typescript
// src/components/lectures/PosterQuestion.tsx
'use client'

import { useState } from 'react'

interface Props {
  lectureId: string
  onPostee: () => void
}

export default function PosterQuestion({ lectureId, onPostee }: Props) {
  const [contenu, setContenu] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const handlePoster = async () => {
    if (!contenu.trim()) return
    setIsLoading(true)
    setErreur(null)
    try {
      const res = await fetch(`/api/lectures/${lectureId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenu: contenu.trim() }),
      })
      if (!res.ok) {
        const { error } = await res.json()
        setErreur(error ?? 'Erreur lors de la publication')
        return
      }
      setContenu('')
      onPostee()
    } catch {
      setErreur('Erreur réseau')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mt-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={contenu}
          onChange={e => setContenu(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handlePoster()}
          placeholder="Poser une question sur ce livre…"
          aria-label="Nouvelle question sur le livre"
          className="flex-1 rounded-xl border border-terracotta/20 bg-cream px-3 py-2 font-manrope text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/40"
        />
        <button
          type="button"
          onClick={handlePoster}
          disabled={isLoading || !contenu.trim()}
          className="px-4 py-2 rounded-full bg-terracotta text-white font-manrope font-semibold text-sm hover:bg-terracotta-deep disabled:opacity-40 transition-colors"
        >
          {isLoading ? '…' : '+ Question'}
        </button>
      </div>
      {erreur && <p role="alert" className="text-xs text-red-600 font-manrope mt-1">{erreur}</p>}
    </div>
  )
}
```

- [ ] **Step 3 : Build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 4 : Commit**

```bash
git add src/components/lectures/QuestionCard.tsx src/components/lectures/PosterQuestion.tsx
git commit -m "feat(etape17): composants QuestionCard + PosterQuestion"
```

---

### Task 6 : Composant LectureCard

**Files:**
- Create: `src/components/lectures/LectureCard.tsx`

- [ ] **Step 1 : Créer le composant**

```typescript
// src/components/lectures/LectureCard.tsx
'use client'

import { useState, useCallback } from 'react'
import type { Lecture, QuestionLecture } from '@/types/lecture'
import { avatarFromEmail, tempsRelatif } from '@/lib/avatar'
import QuestionCard from './QuestionCard'
import PosterQuestion from './PosterQuestion'

const STATUTS = [
  { value: 'pas_commence', label: '— Pas commencé' },
  { value: 'en_cours',     label: '📖 En cours' },
  { value: 'termine',      label: '✅ Terminé' },
] as const

interface Props {
  lecture: Lecture
  currentUserId: string
  onUpdated: () => void
}

export default function LectureCard({ lecture, currentUserId, onUpdated }: Props) {
  const auteurAv = avatarFromEmail(lecture.auteur_email)
  const monAvancement = lecture.avancements.find(a => a.membre_id === currentUserId)
  const monStatut = monAvancement?.statut ?? 'pas_commence'
  const autresAvancements = lecture.avancements.filter(a => a.membre_id !== currentUserId)

  const [questions, setQuestions] = useState<QuestionLecture[] | null>(null)
  const [showQuestions, setShowQuestions] = useState(false)
  const [loadingQ, setLoadingQ] = useState(false)
  const [isUpdatingAv, setIsUpdatingAv] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const loadQuestions = useCallback(async () => {
    setLoadingQ(true)
    try {
      const res = await fetch(`/api/lectures/${lecture.id}/questions`)
      if (res.ok) {
        const { questions: data } = await res.json()
        setQuestions(data)
      }
    } finally {
      setLoadingQ(false)
    }
  }, [lecture.id])

  const handleToggleQuestions = async () => {
    if (!showQuestions && questions === null) await loadQuestions()
    setShowQuestions(v => !v)
  }

  const handleAvancement = async (statut: string) => {
    if (statut === monStatut) return
    setIsUpdatingAv(true)
    setErreur(null)
    try {
      const res = await fetch(`/api/lectures/${lecture.id}/avancement`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut }),
      })
      if (!res.ok) {
        const { error } = await res.json()
        setErreur(error ?? 'Erreur')
        return
      }
      onUpdated()
    } catch {
      setErreur('Erreur réseau')
    } finally {
      setIsUpdatingAv(false)
    }
  }

  const statutEmoji = (statut: string) => {
    if (statut === 'en_cours') return '📖'
    if (statut === 'termine') return '✅'
    return '—'
  }

  return (
    <div className="bg-jasmine rounded-3xl p-4 mb-4 shadow-sm">
      <div className="flex gap-3 mb-3">
        {lecture.couverture_url ? (
          <img
            src={lecture.couverture_url}
            alt={`Couverture de ${lecture.titre}`}
            className="w-14 h-20 object-cover rounded-lg flex-shrink-0"
          />
        ) : (
          <div className="w-14 h-20 bg-sand rounded-lg flex items-center justify-center flex-shrink-0" aria-hidden="true">
            <span className="text-2xl">📚</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-fraunces text-base text-ink leading-tight mb-0.5">{lecture.titre}</p>
          <p className="font-manrope text-xs text-ink-soft italic mb-2">{lecture.auteur_livre}</p>
          <div className="flex items-center gap-2 mb-2">
            <div aria-hidden="true" className={`w-5 h-5 rounded-full ${auteurAv.couleurBg} flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0`}>
              {auteurAv.initiale}
            </div>
            <span className="font-manrope text-xs text-ink-soft">{lecture.auteur_nom} · {tempsRelatif(lecture.created_at)}</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {autresAvancements.map(a => {
              const av = avatarFromEmail(a.membre_email)
              return (
                <span key={a.membre_id} className="flex items-center gap-1 text-xs font-manrope text-ink-soft" title={`${a.membre_nom} : ${a.statut.replace('_', ' ')}`}>
                  <span aria-hidden="true" className={`w-4 h-4 rounded-full ${av.couleurBg} flex items-center justify-center text-white font-bold text-[9px]`}>
                    {av.initiale}
                  </span>
                  {statutEmoji(a.statut)}
                </span>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex gap-1 mb-3" role="radiogroup" aria-label="Mon avancement">
        {STATUTS.map(s => (
          <button
            key={s.value}
            type="button"
            role="radio"
            aria-checked={monStatut === s.value}
            onClick={() => handleAvancement(s.value)}
            disabled={isUpdatingAv}
            className={`flex-1 py-1.5 rounded-full font-manrope text-xs font-semibold transition-all ${
              monStatut === s.value
                ? 'bg-terracotta text-white'
                : 'bg-cream text-ink-soft border border-terracotta/20 hover:border-terracotta/40'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {erreur && <p role="alert" className="text-xs text-red-600 font-manrope mb-2">{erreur}</p>}

      <button
        type="button"
        onClick={handleToggleQuestions}
        className="font-manrope text-sm text-terracotta hover:text-terracotta-deep underline underline-offset-2 transition-colors"
      >
        {showQuestions ? 'Masquer les questions' : `Questions (${lecture.nb_questions})`}
      </button>

      {showQuestions && (
        <div className="mt-3">
          {loadingQ ? (
            <p className="font-manrope text-xs text-ink-soft">Chargement…</p>
          ) : (
            <>
              {(questions ?? []).map(q => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  lectureId={lecture.id}
                  currentUserId={currentUserId}
                  onRepondu={loadQuestions}
                />
              ))}
              <PosterQuestion lectureId={lecture.id} onPostee={loadQuestions} />
            </>
          )}
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
git add src/components/lectures/LectureCard.tsx
git commit -m "feat(etape17): composant LectureCard"
```

---

### Task 7 : Composant AjouterLecture

**Files:**
- Create: `src/components/lectures/AjouterLecture.tsx`

- [ ] **Step 1 : Créer le composant**

```typescript
// src/components/lectures/AjouterLecture.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import type { GoogleBooksResult } from '@/types/lecture'

// Sandra et Sarah uniquement — Papa n'a pas besoin de s'assigner à lui-même
const MEMBRES_ASSIGNABLES = [
  { id: '1a0967e9-91e0-48f6-a3da-752255274153', nom: 'Sandra' },
  { id: '617eff77-47ed-40e0-b784-c027183c9bee', nom: 'Sarah' },
]

interface Props {
  onCree: () => void
  onAnnuler: () => void
}

export default function AjouterLecture({ onCree, onAnnuler }: Props) {
  const [recherche, setRecherche] = useState('')
  const [resultats, setResultats] = useState<GoogleBooksResult[]>([])
  const [showResultats, setShowResultats] = useState(false)
  const [manuel, setManuel] = useState(false)
  const [titre, setTitre] = useState('')
  const [auteurLivre, setAuteurLivre] = useState('')
  const [description, setDescription] = useState('')
  const [couvertureUrl, setCouvertureUrl] = useState('')
  const [assignees, setAssignees] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!recherche.trim() || manuel) {
      setResultats([])
      setShowResultats(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await fetch(`/api/google-books?q=${encodeURIComponent(recherche)}`)
        if (res.ok) {
          const { results } = await res.json()
          setResultats(results)
          setShowResultats(results.length > 0)
        }
      } finally {
        setIsSearching(false)
      }
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [recherche, manuel])

  const handleSelectResultat = (r: GoogleBooksResult) => {
    setTitre(r.titre)
    setAuteurLivre(r.auteur)
    setDescription(r.description ?? '')
    setCouvertureUrl(r.couverture_url ?? '')
    setShowResultats(false)
    setManuel(true)
  }

  const toggleAssignee = (id: string) => {
    setAssignees(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id])
  }

  const handlePublier = async () => {
    if (!titre.trim() || !auteurLivre.trim()) return
    setIsLoading(true)
    setErreur(null)
    try {
      const res = await fetch('/api/lectures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titre: titre.trim(),
          auteur_livre: auteurLivre.trim(),
          description: description.trim() || undefined,
          couverture_url: couvertureUrl.trim() || undefined,
          assignees,
        }),
      })
      if (!res.ok) {
        const { error } = await res.json()
        setErreur(error ?? 'Erreur lors de l\'ajout')
        return
      }
      onCree()
    } catch {
      setErreur('Erreur réseau')
    } finally {
      setIsLoading(false)
    }
  }

  const canSubmit = titre.trim() && auteurLivre.trim()

  return (
    <div className="bg-jasmine rounded-3xl p-4 mb-4 border-2 border-terracotta/20">
      <h2 className="font-fraunces text-lg text-ink mb-3">Ajouter un livre</h2>

      {!manuel && (
        <div className="relative mb-2">
          <input
            type="text"
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            placeholder="Rechercher un livre…"
            aria-label="Rechercher un livre"
            className="w-full rounded-xl border border-terracotta/20 bg-cream px-3 py-2 font-manrope text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/40"
          />
          {isSearching && <p className="font-manrope text-xs text-ink-soft mt-1">Recherche…</p>}
          {showResultats && (
            <div className="absolute top-full left-0 right-0 z-10 bg-jasmine border border-terracotta/20 rounded-xl mt-1 overflow-hidden shadow-lg">
              {resultats.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectResultat(r)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-sand transition-colors text-left"
                >
                  {r.couverture_url && (
                    <img src={r.couverture_url} alt="" aria-hidden="true" className="w-8 h-11 object-cover rounded flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-manrope text-sm text-ink font-semibold truncate">{r.titre}</p>
                    <p className="font-manrope text-xs text-ink-soft truncate">{r.auteur}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {!manuel && (
        <button
          type="button"
          onClick={() => setManuel(true)}
          className="font-manrope text-xs text-terracotta underline underline-offset-2 mb-3 block"
        >
          Saisie manuelle
        </button>
      )}

      {manuel && (
        <div className="flex flex-col gap-2 mb-3">
          <input
            type="text"
            value={titre}
            onChange={e => setTitre(e.target.value)}
            placeholder="Titre du livre *"
            aria-label="Titre du livre"
            className="w-full rounded-xl border border-terracotta/20 bg-cream px-3 py-2 font-manrope text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/40"
          />
          <input
            type="text"
            value={auteurLivre}
            onChange={e => setAuteurLivre(e.target.value)}
            placeholder="Auteur *"
            aria-label="Auteur du livre"
            className="w-full rounded-xl border border-terracotta/20 bg-cream px-3 py-2 font-manrope text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/40"
          />
          <input
            type="url"
            value={couvertureUrl}
            onChange={e => setCouvertureUrl(e.target.value)}
            placeholder="URL de la couverture (optionnel)"
            aria-label="URL de la couverture"
            className="w-full rounded-xl border border-terracotta/20 bg-cream px-3 py-2 font-manrope text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/40"
          />
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Description (optionnel)"
            aria-label="Description du livre"
            rows={2}
            className="w-full rounded-xl border border-terracotta/20 bg-cream px-3 py-2 font-manrope text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/40 resize-none"
          />
        </div>
      )}

      <div className="mb-4">
        <p className="font-manrope text-xs text-ink-soft mb-2">Pour qui ?</p>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setAssignees([])}
            className={`px-3 py-1 rounded-full font-manrope text-xs font-semibold transition-all ${
              assignees.length === 0
                ? 'bg-terracotta text-white'
                : 'bg-cream text-ink-soft border border-terracotta/20 hover:border-terracotta/40'
            }`}
          >
            Tout le monde
          </button>
          {MEMBRES_ASSIGNABLES.map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => toggleAssignee(m.id)}
              className={`px-3 py-1 rounded-full font-manrope text-xs font-semibold transition-all ${
                assignees.includes(m.id)
                  ? 'bg-terracotta text-white'
                  : 'bg-cream text-ink-soft border border-terracotta/20 hover:border-terracotta/40'
              }`}
            >
              {m.nom}
            </button>
          ))}
        </div>
      </div>

      {erreur && <p role="alert" className="text-xs text-red-600 font-manrope mb-2">{erreur}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onAnnuler}
          className="flex-1 py-2 rounded-full border border-terracotta/20 font-manrope text-sm text-ink-soft hover:bg-sand transition-colors"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={handlePublier}
          disabled={isLoading || !canSubmit}
          className="flex-1 py-2 rounded-full bg-terracotta text-white font-manrope font-semibold text-sm hover:bg-terracotta-deep disabled:opacity-40 transition-colors"
        >
          {isLoading ? 'Ajout…' : 'Ajouter'}
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
git add src/components/lectures/AjouterLecture.tsx
git commit -m "feat(etape17): composant AjouterLecture avec recherche Google Books"
```

---

### Task 8 : LecturesSection + intégration DefisPage

**Files:**
- Create: `src/components/lectures/LecturesSection.tsx`
- Modify: `src/components/defis/DefisPage.tsx`

- [ ] **Step 1 : Créer `src/components/lectures/LecturesSection.tsx`**

```typescript
// src/components/lectures/LecturesSection.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Lecture } from '@/types/lecture'
import LectureCard from './LectureCard'
import AjouterLecture from './AjouterLecture'

interface Props {
  userId: string
}

export default function LecturesSection({ userId }: Props) {
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [showAjouter, setShowAjouter] = useState(false)
  const [erreurChargement, setErreurChargement] = useState<string | null>(null)

  const loadLectures = useCallback(async () => {
    const res = await fetch('/api/lectures')
    if (res.ok) {
      const { lectures: data } = await res.json()
      setLectures(data)
      setErreurChargement(null)
    } else {
      setErreurChargement('Impossible de charger les lectures')
    }
  }, [])

  useEffect(() => { loadLectures() }, [loadLectures])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-fraunces text-xl text-ink">Lectures 📚</h2>
        <button
          type="button"
          onClick={() => setShowAjouter(v => !v)}
          className="px-4 py-2 rounded-full bg-terracotta text-white font-manrope font-semibold text-sm hover:bg-terracotta-deep transition-colors"
        >
          {showAjouter ? 'Annuler' : '+ Ajouter'}
        </button>
      </div>

      {showAjouter && (
        <AjouterLecture
          onCree={() => { setShowAjouter(false); loadLectures() }}
          onAnnuler={() => setShowAjouter(false)}
        />
      )}

      {erreurChargement && (
        <p role="alert" className="font-manrope text-sm text-red-600 text-center mb-4">{erreurChargement}</p>
      )}

      {lectures.length === 0 && !showAjouter && !erreurChargement ? (
        <p className="font-caveat text-center text-ink-soft text-xl">
          Pas encore de lecture… proposez un livre ! 📚
        </p>
      ) : (
        lectures.map(l => (
          <LectureCard key={l.id} lecture={l} currentUserId={userId} onUpdated={loadLectures} />
        ))
      )}
    </div>
  )
}
```

- [ ] **Step 2 : Modifier `src/components/defis/DefisPage.tsx`**

Lire d'abord le fichier pour s'assurer qu'il correspond à la version attendue, puis remplacer son contenu par :

```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { Defi } from '@/types/defi'
import DefiCard from './DefiCard'
import MotCard from './MotCard'
import CreerDefi from './CreerDefi'
import LecturesSection from '@/components/lectures/LecturesSection'

interface Props {
  userId: string
}

export default function DefisPage({ userId }: Props) {
  const [defis, setDefis] = useState<Defi[]>([])
  const [showCreer, setShowCreer] = useState(false)
  const [erreurChargement, setErreurChargement] = useState<string | null>(null)

  const loadDefis = useCallback(async () => {
    const res = await fetch('/api/defis')
    if (res.ok) {
      const { defis: data } = await res.json()
      setDefis(data)
      setErreurChargement(null)
    } else {
      setErreurChargement('Impossible de charger les défis')
    }
  }, [])

  useEffect(() => { loadDefis() }, [loadDefis])

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    const channel = supabase
      .channel('defis-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'defis' }, () => loadDefis())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reponses_defis' }, () => loadDefis())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [loadDefis])

  return (
    <div className="min-h-screen bg-cream pb-32">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-fraunces text-2xl text-ink">Défis & Mots 🎯</h1>
          <button
            type="button"
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

        {erreurChargement && defis.length === 0 && !showCreer ? (
          <p role="alert" className="font-manrope text-sm text-red-600 text-center mt-8">{erreurChargement}</p>
        ) : defis.length === 0 && !showCreer ? (
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

        <hr className="my-8 border-terracotta/20" />

        <LecturesSection userId={userId} />
      </div>
    </div>
  )
}
```

- [ ] **Step 3 : Build**

```bash
npm run build
```

Expected: no errors. La page `/defis` affiche les deux sections.

- [ ] **Step 4 : Commit**

```bash
git add src/components/lectures/LecturesSection.tsx src/components/defis/DefisPage.tsx
git commit -m "feat(etape17): LecturesSection + intégration DefisPage"
```

---

## Vérification manuelle post-déploiement

1. Exécuter `supabase/etape17-schema.sql` dans Supabase Dashboard → SQL Editor
2. Connecté en tant que Papa → aller sur `/defis`, scroller jusqu'à la section "Lectures 📚"
3. Cliquer "+ Ajouter" → rechercher "Le Petit Prince" → sélectionner dans les résultats → vérifier que les champs se pré-remplissent
4. Publier → le livre apparaît dans la section
5. Cliquer "— Pas commencé" → passer à "📖 En cours" → vérifier que le bouton se met à jour
6. Cliquer "Questions (0)" → vérifier le lazy-load → poster une question
7. Connecté en tant que Sandra → voir le livre → répondre à la question → vérifier "✓ Tu as répondu"
8. Retour Papa → voir la réponse de Sandra affichée
9. Tester la saisie manuelle (bouton "Saisie manuelle")
10. Vérifier que la section "Défis & Mots 🎯" existante fonctionne toujours normalement
