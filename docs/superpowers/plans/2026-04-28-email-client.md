# Étape 13 — Client Email Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construire un client email IMAP/SMTP pour les 3 comptes @khedhiri.me (OVH Perso), accessible via `/email`, avec une version complète pour Papa et simplifiée pour les filles.

**Architecture:** Next.js API routes font office de proxy IMAP/SMTP — elles récupèrent le mot de passe email chiffré depuis Supabase (`email_credentials`), le déchiffrent côté serveur (AES-256-GCM, Node.js crypto), ouvrent une connexion IMAP/SMTP, et retournent les données. Les credentials ne transitent jamais en clair côté browser.

**Tech Stack:** `imapflow` (IMAP), `nodemailer` (SMTP), `mailparser` (parsing RFC822), Node.js `crypto` (chiffrement serveur), Supabase (stockage credentials chiffrés), Next.js API routes.

---

## File Structure

**Créer :**
- `src/types/email.ts` — types EmailMessage, EmailMessageDetail
- `src/lib/email/crypto.ts` — chiffrement/déchiffrement serveur AES-256-GCM
- `src/lib/email/imap.ts` — wrapper imapflow (fetch liste + message complet)
- `src/lib/email/smtp.ts` — wrapper nodemailer (envoi)
- `src/app/api/email/setup/route.ts` — POST: sauvegarde mot de passe chiffré
- `src/app/api/email/messages/route.ts` — GET: liste inbox
- `src/app/api/email/message/[uid]/route.ts` — GET: message complet, DELETE: suppression
- `src/app/api/email/send/route.ts` — POST: envoi email
- `src/app/email/page.tsx` — page principale
- `src/components/email/EmailSetup.tsx` — saisie unique du mot de passe email
- `src/components/email/EmailInbox.tsx` — liste des messages
- `src/components/email/EmailMessage.tsx` — lecture d'un message
- `src/components/email/EmailCompose.tsx` — écriture/réponse

**Modifier :**
- `src/components/NavBar.tsx` — ajouter lien email (icône enveloppe)

---

## Task 1 : Dépendances, table Supabase, variables d'env

**Files:**
- Modify: `package.json` (via npm install)
- Supabase: nouvelle table `email_credentials`
- Create: `.env.local` (ajout variable)

- [ ] **Step 1 : Installer les dépendances**

```bash
cd C:/khedhiri
npm install imapflow nodemailer mailparser
npm install --save-dev @types/nodemailer @types/mailparser
```

Expected output : packages installés sans erreur.

- [ ] **Step 2 : Créer la table Supabase**

Aller sur https://supabase.com/dashboard → projet khedhiri → SQL Editor → New Query, exécuter :

```sql
CREATE TABLE email_credentials (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE email_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Credentials personnels"
  ON email_credentials
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

- [ ] **Step 3 : Ajouter la variable d'environnement locale**

Dans `.env.local`, ajouter :

```
EMAIL_ENCRYPTION_SECRET=khedhiri-email-secret-32chars-min
OVH_IMAP_HOST=ssl0.ovh.net
OVH_IMAP_PORT=993
OVH_SMTP_HOST=ssl0.ovh.net
OVH_SMTP_PORT=465
```

Remplacer `khedhiri-email-secret-32chars-min` par une vraie valeur aléatoire (ex: générer avec `openssl rand -base64 32`).

- [ ] **Step 4 : Ajouter la variable sur Vercel**

Aller sur https://vercel.com/dashboard → projet khedhiri → Settings → Environment Variables, ajouter les 5 variables ci-dessus (même valeurs).

- [ ] **Step 5 : Commit**

```bash
cd C:/khedhiri
git add package.json package-lock.json
git commit -m "deps: imapflow + nodemailer + mailparser pour client email"
```

---

## Task 2 : Types TypeScript + crypto serveur

**Files:**
- Create: `src/types/email.ts`
- Create: `src/lib/email/crypto.ts`

- [ ] **Step 1 : Créer les types**

Créer `src/types/email.ts` :

```typescript
export interface EmailMessage {
  uid: number
  subject: string
  from: string
  fromName: string
  date: string
  seen: boolean
}

export interface EmailMessageDetail {
  uid: number
  subject: string
  from: string
  fromName: string
  to: string
  date: string
  seen: boolean
  body: string
  html: string | null
}

export interface SendEmailParams {
  to: string
  subject: string
  body: string
  replyToSubject?: string
}
```

- [ ] **Step 2 : Créer la librairie de chiffrement serveur**

Créer `src/lib/email/crypto.ts` :

```typescript
import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'crypto'

function deriveKey(userId: string): Buffer {
  const secret = process.env.EMAIL_ENCRYPTION_SECRET
  if (!secret) throw new Error('EMAIL_ENCRYPTION_SECRET manquant')
  return createHmac('sha256', secret).update(userId).digest()
}

export function encryptPassword(plaintext: string, userId: string): string {
  const key = deriveKey(userId)
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted]).toString('base64')
}

export function decryptPassword(ciphertext: string, userId: string): string {
  const key = deriveKey(userId)
  const buf = Buffer.from(ciphertext, 'base64')
  const iv = buf.subarray(0, 12)
  const tag = buf.subarray(12, 28)
  const encrypted = buf.subarray(28)
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  return decipher.update(encrypted).toString('utf8') + decipher.final('utf8')
}
```

- [ ] **Step 3 : Vérifier la compilation**

```bash
cd C:/khedhiri
npx tsc --noEmit
```

Expected output : aucune erreur TypeScript.

- [ ] **Step 4 : Commit**

```bash
git add src/types/email.ts src/lib/email/crypto.ts
git commit -m "feat: types email + crypto serveur AES-256-GCM"
```

---

## Task 3 : Wrapper IMAP (imapflow)

**Files:**
- Create: `src/lib/email/imap.ts`

- [ ] **Step 1 : Créer le wrapper IMAP**

Créer `src/lib/email/imap.ts` :

```typescript
import { ImapFlow } from 'imapflow'
import { simpleParser } from 'mailparser'
import type { EmailMessage, EmailMessageDetail } from '@/types/email'

const IMAP_HOST = process.env.OVH_IMAP_HOST ?? 'ssl0.ovh.net'
const IMAP_PORT = Number(process.env.OVH_IMAP_PORT ?? '993')

function makeClient(email: string, password: string): ImapFlow {
  return new ImapFlow({
    host: IMAP_HOST,
    port: IMAP_PORT,
    secure: true,
    auth: { user: email, pass: password },
    logger: false,
    connectionTimeout: 8000,
    greetingTimeout: 5000,
  })
}

export async function fetchMessages(
  email: string,
  password: string,
  folder = 'INBOX',
  page = 1,
): Promise<EmailMessage[]> {
  const client = makeClient(email, password)
  await client.connect()
  const lock = await client.getMailboxLock(folder)
  try {
    const total = (client.mailbox as { exists: number }).exists
    if (total === 0) return []
    const pageSize = 20
    const to = Math.max(1, total - (page - 1) * pageSize)
    const from = Math.max(1, to - pageSize + 1)
    const messages: EmailMessage[] = []
    for await (const msg of client.fetch(`${from}:${to}`, {
      uid: true,
      envelope: true,
      flags: true,
    })) {
      messages.push({
        uid: msg.uid,
        subject: msg.envelope.subject ?? '(sans objet)',
        from: msg.envelope.from?.[0]?.address ?? '',
        fromName: msg.envelope.from?.[0]?.name ?? '',
        date: msg.envelope.date?.toISOString() ?? '',
        seen: msg.flags.has('\\Seen'),
      })
    }
    return messages.reverse()
  } finally {
    lock.release()
    await client.logout()
  }
}

export async function fetchMessageDetail(
  email: string,
  password: string,
  uid: number,
  folder = 'INBOX',
): Promise<EmailMessageDetail | null> {
  const client = makeClient(email, password)
  await client.connect()
  const lock = await client.getMailboxLock(folder)
  try {
    let result: EmailMessageDetail | null = null
    for await (const msg of client.fetch(
      { uid: String(uid) },
      { uid: true, envelope: true, source: true, flags: true },
      { uid: true },
    )) {
      const parsed = await simpleParser(msg.source)
      result = {
        uid: msg.uid,
        subject: msg.envelope.subject ?? '(sans objet)',
        from: msg.envelope.from?.[0]?.address ?? '',
        fromName: msg.envelope.from?.[0]?.name ?? '',
        to: msg.envelope.to?.[0]?.address ?? '',
        date: msg.envelope.date?.toISOString() ?? '',
        seen: msg.flags.has('\\Seen'),
        body: parsed.text ?? '',
        html: parsed.html || null,
      }
      // Marquer comme lu
      await client.messageFlagsAdd({ uid: String(uid) }, ['\\Seen'], { uid: true })
    }
    return result
  } finally {
    lock.release()
    await client.logout()
  }
}

export async function deleteMessage(
  email: string,
  password: string,
  uid: number,
  folder = 'INBOX',
): Promise<void> {
  const client = makeClient(email, password)
  await client.connect()
  const lock = await client.getMailboxLock(folder)
  try {
    await client.messageDelete({ uid: String(uid) }, { uid: true })
  } finally {
    lock.release()
    await client.logout()
  }
}

```

- [ ] **Step 2 : Vérifier la compilation**

```bash
cd C:/khedhiri
npx tsc --noEmit
```

Expected output : aucune erreur TypeScript.

- [ ] **Step 3 : Commit**

```bash
git add src/lib/email/imap.ts
git commit -m "feat: wrapper IMAP imapflow (fetch, detail, delete)"
```

---

## Task 4 : Wrapper SMTP (nodemailer)

**Files:**
- Create: `src/lib/email/smtp.ts`

- [ ] **Step 1 : Créer le wrapper SMTP**

Créer `src/lib/email/smtp.ts` :

```typescript
import nodemailer from 'nodemailer'

const SMTP_HOST = process.env.OVH_SMTP_HOST ?? 'ssl0.ovh.net'
const SMTP_PORT = Number(process.env.OVH_SMTP_PORT ?? '465')

export async function sendEmail(params: {
  fromEmail: string
  password: string
  to: string
  subject: string
  body: string
}): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: true,
    auth: { user: params.fromEmail, pass: params.password },
  })
  await transporter.sendMail({
    from: params.fromEmail,
    to: params.to,
    subject: params.subject,
    text: params.body,
  })
}
```

- [ ] **Step 2 : Vérifier la compilation**

```bash
cd C:/khedhiri
npx tsc --noEmit
```

Expected output : aucune erreur TypeScript.

- [ ] **Step 3 : Commit**

```bash
git add src/lib/email/smtp.ts
git commit -m "feat: wrapper SMTP nodemailer"
```

---

## Task 5 : API route — setup (POST /api/email/setup)

**Files:**
- Create: `src/app/api/email/setup/route.ts`

- [ ] **Step 1 : Créer la route**

Créer `src/app/api/email/setup/route.ts` :

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { encryptPassword } from '@/lib/email/crypto'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { password } = await request.json() as { password: string }
  if (!password?.trim()) {
    return NextResponse.json({ error: 'Mot de passe requis' }, { status: 400 })
  }

  const encryptedPassword = encryptPassword(password.trim(), user.id)

  const { error } = await supabase
    .from('email_credentials')
    .upsert({ user_id: user.id, encrypted_password: encryptedPassword, updated_at: new Date().toISOString() })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2 : Vérifier la compilation**

```bash
cd C:/khedhiri
npx tsc --noEmit
```

- [ ] **Step 3 : Commit**

```bash
git add src/app/api/email/setup/route.ts
git commit -m "feat: API POST /api/email/setup — sauvegarde credentials chiffrés"
```

---

## Task 6 : API route — messages (GET /api/email/messages)

**Files:**
- Create: `src/app/api/email/messages/route.ts`

- [ ] **Step 1 : Créer la route**

Créer `src/app/api/email/messages/route.ts` :

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { decryptPassword } from '@/lib/email/crypto'
import { fetchMessages } from '@/lib/email/imap'

const PAPA_EMAIL = 'houssem@khedhiri.me'

export const maxDuration = 30

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const folder = searchParams.get('folder') ?? 'INBOX'
  const page = Number(searchParams.get('page') ?? '1')

  // Les filles ne peuvent accéder qu'à INBOX
  const allowedFolder = user.email === PAPA_EMAIL ? folder : 'INBOX'

  const { data: creds } = await supabase
    .from('email_credentials')
    .select('encrypted_password')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!creds) return NextResponse.json({ error: 'Boîte non configurée' }, { status: 404 })

  try {
    const password = decryptPassword(creds.encrypted_password, user.id)
    const messages = await fetchMessages(user.email!, password, allowedFolder, page)
    return NextResponse.json({ messages })
  } catch (err) {
    console.error('IMAP error:', err)
    return NextResponse.json({ error: 'Impossible de se connecter à la boîte mail' }, { status: 500 })
  }
}
```

- [ ] **Step 2 : Vérifier la compilation**

```bash
cd C:/khedhiri
npx tsc --noEmit
```

- [ ] **Step 3 : Commit**

```bash
git add src/app/api/email/messages/route.ts
git commit -m "feat: API GET /api/email/messages — liste inbox"
```

---

## Task 7 : API route — message detail + suppression

**Files:**
- Create: `src/app/api/email/message/[uid]/route.ts`

- [ ] **Step 1 : Créer la route**

Créer `src/app/api/email/message/[uid]/route.ts` :

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { decryptPassword } from '@/lib/email/crypto'
import { fetchMessageDetail, deleteMessage } from '@/lib/email/imap'

const PAPA_ID = 'b6025d5f-77d5-4208-b489-bcc717ebc01c'

export const maxDuration = 30

export async function GET(
  request: Request,
  { params }: { params: Promise<{ uid: string }> },
) {
  const { uid } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const folder = searchParams.get('folder') ?? 'INBOX'

  const { data: creds } = await supabase
    .from('email_credentials')
    .select('encrypted_password')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!creds) return NextResponse.json({ error: 'Boîte non configurée' }, { status: 404 })

  try {
    const password = decryptPassword(creds.encrypted_password, user.id)
    const message = await fetchMessageDetail(user.email!, password, Number(uid), folder)
    if (!message) return NextResponse.json({ error: 'Message non trouvé' }, { status: 404 })
    return NextResponse.json({ message })
  } catch (err) {
    console.error('IMAP error:', err)
    return NextResponse.json({ error: 'Impossible de récupérer le message' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ uid: string }> },
) {
  const { uid } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (user.id !== PAPA_ID) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const folder = searchParams.get('folder') ?? 'INBOX'

  const { data: creds } = await supabase
    .from('email_credentials')
    .select('encrypted_password')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!creds) return NextResponse.json({ error: 'Boîte non configurée' }, { status: 404 })

  try {
    const password = decryptPassword(creds.encrypted_password, user.id)
    await deleteMessage(user.email!, password, Number(uid), folder)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('IMAP error:', err)
    return NextResponse.json({ error: 'Impossible de supprimer le message' }, { status: 500 })
  }
}
```

- [ ] **Step 2 : Vérifier la compilation**

```bash
cd C:/khedhiri
npx tsc --noEmit
```

- [ ] **Step 3 : Commit**

```bash
git add "src/app/api/email/message/[uid]/route.ts"
git commit -m "feat: API GET+DELETE /api/email/message/[uid]"
```

---

## Task 8 : API route — envoi (POST /api/email/send)

**Files:**
- Create: `src/app/api/email/send/route.ts`

- [ ] **Step 1 : Créer la route**

Créer `src/app/api/email/send/route.ts` :

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { decryptPassword } from '@/lib/email/crypto'
import { sendEmail } from '@/lib/email/smtp'

export const maxDuration = 30

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { to, subject, body } = await request.json() as {
    to: string
    subject: string
    body: string
  }

  if (!to?.trim() || !subject?.trim() || !body?.trim()) {
    return NextResponse.json({ error: 'Champs À, Sujet et Corps requis' }, { status: 400 })
  }

  const { data: creds } = await supabase
    .from('email_credentials')
    .select('encrypted_password')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!creds) return NextResponse.json({ error: 'Boîte non configurée' }, { status: 404 })

  try {
    const password = decryptPassword(creds.encrypted_password, user.id)
    await sendEmail({ fromEmail: user.email!, password, to: to.trim(), subject: subject.trim(), body: body.trim() })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('SMTP error:', err)
    return NextResponse.json({ error: 'Impossible d\'envoyer le message' }, { status: 500 })
  }
}
```

- [ ] **Step 2 : Vérifier la compilation**

```bash
cd C:/khedhiri
npx tsc --noEmit
```

- [ ] **Step 3 : Commit**

```bash
git add src/app/api/email/send/route.ts
git commit -m "feat: API POST /api/email/send — envoi SMTP"
```

---

## Task 9 : Composant EmailSetup

**Files:**
- Create: `src/components/email/EmailSetup.tsx`

- [ ] **Step 1 : Créer le composant**

Créer `src/components/email/EmailSetup.tsx` :

```typescript
'use client'

import { useState } from 'react'

interface EmailSetupProps {
  onConfigured: () => void
}

export default function EmailSetup({ onConfigured }: EmailSetupProps) {
  const [password, setPassword] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password.trim()) { setErreur('Le mot de passe est requis.'); return }
    setErreur(null)
    setIsPending(true)
    try {
      const res = await fetch('/api/email/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? 'Erreur inconnue')
      }
      onConfigured()
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur inconnue')
      setIsPending(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="font-fraunces text-2xl font-bold text-ink mb-2">Ma boîte mail ✉️</h1>
      <p className="font-manrope text-sm text-ink-soft mb-6">
        Entre le mot de passe de ton adresse @khedhiri.me. Il sera sauvegardé une seule fois.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-manrope text-sm font-semibold text-ink mb-1" htmlFor="email-password">
            Mot de passe email
          </label>
          <input
            id="email-password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border border-sand-warm rounded-lg px-3 py-2 font-manrope text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-terracotta"
            autoComplete="current-password"
            required
          />
        </div>
        {erreur && <p className="font-manrope text-sm text-red-600">{erreur}</p>}
        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3 rounded-xl bg-terracotta text-white font-manrope text-sm font-semibold hover:bg-terracotta-deep transition-colors disabled:opacity-50"
        >
          {isPending ? 'Connexion...' : 'Configurer ma boîte ✉️'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 2 : Vérifier la compilation**

```bash
cd C:/khedhiri
npx tsc --noEmit
```

- [ ] **Step 3 : Commit**

```bash
git add src/components/email/EmailSetup.tsx
git commit -m "feat: composant EmailSetup — saisie unique mot de passe email"
```

---

## Task 10 : Composant EmailCompose

**Files:**
- Create: `src/components/email/EmailCompose.tsx`

- [ ] **Step 1 : Créer le composant**

Créer `src/components/email/EmailCompose.tsx` :

```typescript
'use client'

import { useState } from 'react'

interface EmailComposeProps {
  isPapa: boolean
  defaultTo?: string
  defaultSubject?: string
  onSent: () => void
  onCancel: () => void
}

export default function EmailCompose({ isPapa, defaultTo = '', defaultSubject = '', onSent, onCancel }: EmailComposeProps) {
  const [to, setTo] = useState(defaultTo)
  const [subject, setSubject] = useState(defaultSubject)
  const [body, setBody] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!to.trim() || !subject.trim() || !body.trim()) {
      setErreur('Tous les champs sont requis.')
      return
    }
    setErreur(null)
    setIsPending(true)
    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: to.trim(), subject: subject.trim(), body: body.trim() }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? 'Erreur inconnue')
      }
      onSent()
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur inconnue')
      setIsPending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onCancel} role="dialog" aria-modal="true">
      <div className="bg-jasmine rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-fraunces text-xl font-bold text-ink">Nouveau message</h2>
          <button onClick={onCancel} className="text-ink-soft hover:text-ink text-2xl leading-none" aria-label="Fermer">×</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block font-manrope text-sm font-semibold text-ink mb-1" htmlFor="compose-to">À</label>
            <input id="compose-to" type="email" value={to} onChange={e => setTo(e.target.value)}
              className="w-full border border-sand-warm rounded-lg px-3 py-2 font-manrope text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-terracotta"
              required />
          </div>
          <div>
            <label className="block font-manrope text-sm font-semibold text-ink mb-1" htmlFor="compose-subject">Sujet</label>
            <input id="compose-subject" type="text" value={subject} onChange={e => setSubject(e.target.value)}
              className="w-full border border-sand-warm rounded-lg px-3 py-2 font-manrope text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-terracotta"
              required />
          </div>
          <div>
            <label className="block font-manrope text-sm font-semibold text-ink mb-1" htmlFor="compose-body">Message</label>
            <textarea id="compose-body" value={body} onChange={e => setBody(e.target.value)} rows={6}
              className="w-full border border-sand-warm rounded-lg px-3 py-2 font-manrope text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-terracotta resize-none"
              required />
          </div>
          {erreur && <p className="font-manrope text-sm text-red-600">{erreur}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCancel}
              className="flex-1 py-2 rounded-xl border border-sand-warm font-manrope text-sm text-ink-soft hover:bg-sand transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={isPending}
              className="flex-1 py-2 rounded-xl bg-terracotta text-white font-manrope text-sm font-semibold hover:bg-terracotta-deep transition-colors disabled:opacity-50">
              {isPending ? 'Envoi...' : 'Envoyer ✉️'}
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
cd C:/khedhiri
npx tsc --noEmit
```

- [ ] **Step 3 : Commit**

```bash
git add src/components/email/EmailCompose.tsx
git commit -m "feat: composant EmailCompose — formulaire envoi email"
```

---

## Task 11 : Composant EmailMessage

**Files:**
- Create: `src/components/email/EmailMessage.tsx`

- [ ] **Step 1 : Créer le composant**

Créer `src/components/email/EmailMessage.tsx` :

```typescript
'use client'

import { useState } from 'react'
import type { EmailMessageDetail } from '@/types/email'
import EmailCompose from './EmailCompose'

interface EmailMessageProps {
  message: EmailMessageDetail
  isPapa: boolean
  folder: string
  onBack: () => void
  onDeleted: () => void
}

export default function EmailMessage({ message, isPapa, folder, onBack, onDeleted }: EmailMessageProps) {
  const [showCompose, setShowCompose] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm('Supprimer ce message ?')) return
    setIsDeleting(true)
    try {
      await fetch(`/api/email/message/${message.uid}?folder=${encodeURIComponent(folder)}`, { method: 'DELETE' })
      onDeleted()
    } finally {
      setIsDeleting(false)
    }
  }

  const replySubject = message.subject.startsWith('Re:') ? message.subject : `Re: ${message.subject}`

  return (
    <>
      <div className="max-w-2xl mx-auto px-4 py-4">
        <button onClick={onBack} className="font-manrope text-sm text-ink-soft hover:text-ink mb-4 flex items-center gap-1">
          ← Retour
        </button>
        <h1 className="font-fraunces text-xl font-bold text-ink mb-1">{message.subject}</h1>
        <div className="flex items-center justify-between mb-4">
          <div className="font-manrope text-sm text-ink-soft">
            <span>De : {message.fromName ? `${message.fromName} <${message.from}>` : message.from}</span>
            <span className="mx-2">·</span>
            <span>{new Date(message.date).toLocaleDateString('fr-FR', { dateStyle: 'long' })}</span>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 font-manrope text-sm text-ink whitespace-pre-wrap leading-relaxed mb-4">
          {message.body || '(message vide)'}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowCompose(true)}
            className="px-4 py-2 rounded-xl bg-terracotta text-white font-manrope text-sm font-semibold hover:bg-terracotta-deep transition-colors"
          >
            Répondre
          </button>
          {isPapa && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 rounded-xl border border-sand-warm font-manrope text-sm text-terracotta hover:bg-sand transition-colors disabled:opacity-50"
            >
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </button>
          )}
        </div>
      </div>
      {showCompose && (
        <EmailCompose
          isPapa={isPapa}
          defaultTo={message.from}
          defaultSubject={replySubject}
          onSent={() => setShowCompose(false)}
          onCancel={() => setShowCompose(false)}
        />
      )}
    </>
  )
}
```

- [ ] **Step 2 : Vérifier la compilation**

```bash
cd C:/khedhiri
npx tsc --noEmit
```

- [ ] **Step 3 : Commit**

```bash
git add src/components/email/EmailMessage.tsx
git commit -m "feat: composant EmailMessage — lecture + réponse + suppression"
```

---

## Task 12 : Composant EmailInbox

**Files:**
- Create: `src/components/email/EmailInbox.tsx`

- [ ] **Step 1 : Créer le composant**

Créer `src/components/email/EmailInbox.tsx` :

```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import type { EmailMessage, EmailMessageDetail } from '@/types/email'
import EmailMessageView from './EmailMessage'
import EmailCompose from './EmailCompose'

interface EmailInboxProps {
  isPapa: boolean
}

const FOLDERS_PAPA = [
  { value: 'INBOX', label: 'Boîte de réception' },
  { value: 'Sent', label: 'Envoyés' },
  { value: 'Trash', label: 'Corbeille' },
]

export default function EmailInbox({ isPapa }: EmailInboxProps) {
  const [folder, setFolder] = useState('INBOX')
  const [messages, setMessages] = useState<EmailMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [erreur, setErreur] = useState<string | null>(null)
  const [selectedMessage, setSelectedMessage] = useState<EmailMessageDetail | null>(null)
  const [isLoadingMessage, setIsLoadingMessage] = useState(false)
  const [showCompose, setShowCompose] = useState(false)

  const loadMessages = useCallback(async () => {
    setIsLoading(true)
    setErreur(null)
    try {
      const res = await fetch(`/api/email/messages?folder=${encodeURIComponent(folder)}&page=1`)
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? 'Erreur inconnue')
      }
      const data = await res.json() as { messages: EmailMessage[] }
      setMessages(data.messages)
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setIsLoading(false)
    }
  }, [folder])

  useEffect(() => { loadMessages() }, [loadMessages])

  async function handleSelectMessage(uid: number) {
    setIsLoadingMessage(true)
    try {
      const res = await fetch(`/api/email/message/${uid}?folder=${encodeURIComponent(folder)}`)
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? 'Erreur')
      }
      const data = await res.json() as { message: EmailMessageDetail }
      setSelectedMessage(data.message)
      setMessages(prev => prev.map(m => m.uid === uid ? { ...m, seen: true } : m))
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setIsLoadingMessage(false)
    }
  }

  if (selectedMessage) {
    return (
      <EmailMessageView
        message={selectedMessage}
        isPapa={isPapa}
        folder={folder}
        onBack={() => setSelectedMessage(null)}
        onDeleted={() => { setSelectedMessage(null); loadMessages() }}
      />
    )
  }

  return (
    <>
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-fraunces text-2xl font-bold text-ink">Ma boîte mail ✉️</h1>
          <button
            onClick={() => setShowCompose(true)}
            className="px-3 py-2 rounded-xl bg-terracotta text-white font-manrope text-sm font-semibold hover:bg-terracotta-deep transition-colors"
          >
            + Nouveau
          </button>
        </div>

        {isPapa && (
          <div className="flex gap-2 mb-4 overflow-x-auto">
            {FOLDERS_PAPA.map(f => (
              <button
                key={f.value}
                onClick={() => setFolder(f.value)}
                className={`px-3 py-1 rounded-full font-manrope text-xs font-semibold whitespace-nowrap transition-colors ${
                  folder === f.value
                    ? 'bg-terracotta text-white'
                    : 'bg-sand text-ink-soft hover:bg-sand-warm'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {isLoading && <p className="font-manrope text-sm text-ink-soft py-8 text-center">Chargement...</p>}
        {erreur && <p className="font-manrope text-sm text-red-600 py-4">{erreur}</p>}
        {!isLoading && !erreur && messages.length === 0 && (
          <p className="font-manrope text-sm text-ink-soft py-8 text-center italic">Aucun message.</p>
        )}

        <div className="space-y-2">
          {messages.map(msg => (
            <button
              key={msg.uid}
              onClick={() => handleSelectMessage(msg.uid)}
              disabled={isLoadingMessage}
              className={`w-full text-left rounded-xl p-3 transition-colors hover:bg-sand-warm disabled:opacity-50 ${
                msg.seen ? 'bg-white' : 'bg-jasmine border-l-4 border-terracotta'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className={`font-manrope text-sm ${msg.seen ? 'text-ink-soft' : 'text-ink font-semibold'}`}>
                  {msg.fromName || msg.from}
                </span>
                <span className="font-manrope text-xs text-ink-soft whitespace-nowrap">
                  {new Date(msg.date).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <p className={`font-manrope text-sm mt-0.5 ${msg.seen ? 'text-ink-soft' : 'text-ink'}`}>
                {msg.subject}
              </p>
            </button>
          ))}
        </div>
      </div>

      {showCompose && (
        <EmailCompose
          isPapa={isPapa}
          onSent={() => { setShowCompose(false); loadMessages() }}
          onCancel={() => setShowCompose(false)}
        />
      )}
    </>
  )
}
```

- [ ] **Step 2 : Vérifier la compilation**

```bash
cd C:/khedhiri
npx tsc --noEmit
```

- [ ] **Step 3 : Commit**

```bash
git add src/components/email/EmailInbox.tsx
git commit -m "feat: composant EmailInbox — liste messages + navigation dossiers"
```

---

## Task 13 : Page /email + NavBar

**Files:**
- Create: `src/app/email/page.tsx`
- Modify: `src/components/NavBar.tsx`

- [ ] **Step 1 : Créer la page email**

Créer `src/app/email/page.tsx` :

```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NavBar from '@/components/NavBar'
import EmailSetup from '@/components/email/EmailSetup'
import EmailInboxWrapper from '@/components/email/EmailInboxWrapper'

const PAPA_EMAIL = 'houssem@khedhiri.me'

export default async function EmailPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: creds } = await supabase
    .from('email_credentials')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  const isConfigured = !!creds
  const isPapa = user.email === PAPA_EMAIL

  return (
    <>
      <NavBar />
      <main>
        {isConfigured
          ? <EmailInboxWrapper isPapa={isPapa} />
          : <EmailSetupWrapper />
        }
      </main>
    </>
  )
}
```

Attends — cette page a besoin d'un mécanisme pour passer de Setup à Inbox sans rechargement complet. Utiliser un Client Component wrapper. Créer `src/components/email/EmailInboxWrapper.tsx` :

```typescript
'use client'

import EmailInbox from './EmailInbox'

interface EmailInboxWrapperProps {
  isPapa: boolean
}

export default function EmailInboxWrapper({ isPapa }: EmailInboxWrapperProps) {
  return <EmailInbox isPapa={isPapa} />
}
```

Créer `src/components/email/EmailSetupWrapper.tsx` :

```typescript
'use client'

import { useState } from 'react'
import EmailSetup from './EmailSetup'
import EmailInbox from './EmailInbox'

interface EmailSetupWrapperProps {
  isPapa: boolean
}

export default function EmailSetupWrapper({ isPapa }: EmailSetupWrapperProps) {
  const [configured, setConfigured] = useState(false)
  if (configured) return <EmailInbox isPapa={isPapa} />
  return <EmailSetup onConfigured={() => setConfigured(true)} />
}
```

Mettre à jour `src/app/email/page.tsx` :

```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NavBar from '@/components/NavBar'
import EmailSetupWrapper from '@/components/email/EmailSetupWrapper'
import EmailInboxWrapper from '@/components/email/EmailInboxWrapper'

const PAPA_EMAIL = 'houssem@khedhiri.me'

export default async function EmailPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: creds } = await supabase
    .from('email_credentials')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  const isConfigured = !!creds
  const isPapa = user.email === PAPA_EMAIL

  return (
    <>
      <NavBar />
      <main>
        {isConfigured
          ? <EmailInboxWrapper isPapa={isPapa} />
          : <EmailSetupWrapper isPapa={isPapa} />
        }
      </main>
    </>
  )
}
```

- [ ] **Step 2 : Ajouter le lien email dans la NavBar**

Dans `src/components/NavBar.tsx`, après le lien "Famille" (ligne ~138), ajouter avant le bloc `{/* Journal intime */}` :

```typescript
        {/* Email */}
        <Link
          href="/email"
          className="flex items-center gap-1 text-ink-soft hover:text-terracotta transition-colors"
          aria-label="Ma boîte mail"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
          <span className="text-xs font-manrope hidden sm:inline">Email</span>
        </Link>
```

- [ ] **Step 3 : Vérifier la compilation**

```bash
cd C:/khedhiri
npx tsc --noEmit
```

Expected output : aucune erreur TypeScript.

- [ ] **Step 4 : Tester en local**

```bash
cd C:/khedhiri
npm run dev
```

- Aller sur http://localhost:3000/email
- Vérifier que la page EmailSetup s'affiche (boîte non encore configurée)
- Entrer le mot de passe email OVH → vérifier que ça passe à EmailInbox
- Vérifier que les messages se chargent depuis OVH IMAP
- Tester "Nouveau message" → composer → envoyer
- Tester clic sur un message → affichage du contenu
- Vérifier que Papa voit les onglets de dossiers, pas les filles

- [ ] **Step 5 : Commit et déploiement**

```bash
git add src/app/email/page.tsx src/components/email/EmailSetupWrapper.tsx src/components/email/EmailInboxWrapper.tsx src/components/NavBar.tsx
git commit -m "feat: étape 13 — client email IMAP/SMTP (OVH Perso)"
git push
```

Expected output : push réussi, Vercel déploie automatiquement.

---

## Récapitulatif des prérequis avant de commencer

1. **OVH Perso plan** commandé et actif pour khedhiri.me
2. **3 comptes email créés** sur OVH : houssem@, sandra@, sarah@khedhiri.me
3. **Mots de passe email OVH** notés pour les saisir dans l'app
4. **EMAIL_ENCRYPTION_SECRET** ajouté dans `.env.local` ET dans Vercel

---

## ✅ Actions manuelles restantes (avant première utilisation)

- [ ] Commander **OVH Plan Perso** pour khedhiri.me (3,29€/mois)
- [ ] Créer les 3 comptes email sur le panneau OVH : `houssem@khedhiri.me`, `sandra@khedhiri.me`, `sarah@khedhiri.me`
- [ ] Exécuter le SQL dans Supabase (SQL Editor) : contenu du fichier `supabase/etape13-schema.sql`
- [ ] Générer une vraie clé secrète : `openssl rand -base64 32`
- [ ] Remplacer le placeholder dans `.env.local` : `EMAIL_ENCRYPTION_SECRET=<valeur générée>`
- [ ] Ajouter les 5 variables dans Vercel Dashboard → Settings → Environment Variables :
  - `EMAIL_ENCRYPTION_SECRET` (la vraie valeur aléatoire)
  - `OVH_IMAP_HOST=ssl0.ovh.net`
  - `OVH_IMAP_PORT=993`
  - `OVH_SMTP_HOST=ssl0.ovh.net`
  - `OVH_SMTP_PORT=465`
- [ ] Sur khedhiri.me/email : saisir le mot de passe email OVH pour chaque compte (une seule fois)
