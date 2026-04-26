# Étape 1 — Fondations Next.js + Déploiement

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mettre khedhiri.me en ligne avec une page d'accueil chaleureuse et un système de design réutilisable pour toutes les étapes suivantes.

**Architecture:** Next.js 15 (App Router) initialisé dans `C:\khedhiri`. Système de design (palette terracotta/crème + fonts Fraunces/Manrope/Caveat) configuré dans `globals.css` et `layout.tsx`. Page d'accueil temporaire — remplacée par la timeline à l'étape 3.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS (v4 probable), Google Fonts via `next/font/google`

---

### Task 1 : Initialiser le projet Next.js

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json` (générés par create-next-app)
- Create: `src/app/globals.css` (boilerplate — modifié à Task 2)
- Create: `src/app/layout.tsx` (boilerplate — modifié à Task 3)
- Create: `src/app/page.tsx` (boilerplate — modifié à Task 4)

- [ ] **Étape 1 : Lancer create-next-app dans le dossier existant**

```bash
cd /c/khedhiri
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias="@/*" --yes
```

Résultat attendu : fichiers Next.js créés. Le dossier `docs/` et `CLAUDE.md` sont toujours présents.

- [ ] **Étape 2 : Vérifier la structure générée**

```bash
ls /c/khedhiri
```

Résultat attendu : `src/`, `package.json`, `next.config.ts`, `CLAUDE.md`, `docs/` sont tous présents.

- [ ] **Étape 3 : Vérifier la version de Tailwind installée**

```bash
grep tailwindcss /c/khedhiri/package.json
```

Résultat attendu : `"tailwindcss": "^4.x.x"` (v4) ou `"tailwindcss": "^3.x.x"` (v3). **Note cette version — elle détermine la syntaxe à Task 2.**

- [ ] **Étape 4 : Tester le boilerplate en local**

```bash
cd /c/khedhiri && npm run dev
```

Ouvre http://localhost:3000 — tu dois voir la page par défaut Next.js. Arrête avec Ctrl+C.

- [ ] **Étape 5 : Commit initial**

```bash
cd /c/khedhiri
git init
git add .
git commit -m "chore: init Next.js 15 — boilerplate"
```

---

### Task 2 : Configurer le système de design (palette + fonts)

**Files:**
- Modify: `src/app/globals.css`
- Modify: `tailwind.config.ts` (Tailwind v3 uniquement)

- [ ] **Étape 1 : Remplacer globals.css**

**Si Tailwind v4** (probablement le cas) — remplace tout `src/app/globals.css` par :

```css
@import "tailwindcss";

@theme {
  /* Palette khedhiri.me */
  --color-terracotta: #C5563D;
  --color-terracotta-deep: #9B3F2A;
  --color-olive: #6B7B3F;
  --color-azur: #2E5C8A;
  --color-azur-deep: #1E3F62;
  --color-sand: #F4E8D8;
  --color-sand-warm: #EDD9BC;
  --color-cream: #FAF4EA;
  --color-jasmine: #FFF8E7;
  --color-gold: #D4A04C;
  --color-rose: #E8A598;
  --color-ink: #2A1F18;
  --color-ink-soft: #5A4A3F;

  /* Fonts — référencent les variables CSS injectées par next/font dans layout.tsx */
  --font-fraunces: var(--font-fraunces-var), Georgia, serif;
  --font-manrope: var(--font-manrope-var), system-ui, sans-serif;
  --font-caveat: var(--font-caveat-var), cursive;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  background-color: var(--color-cream);
  color: var(--color-ink);
}
```

> Avec Tailwind v4, `--color-terracotta` génère automatiquement les classes `text-terracotta`, `bg-terracotta`, etc. Et `--font-fraunces` génère la classe `font-fraunces`.

**Si Tailwind v3** — remplace tout `src/app/globals.css` par :

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-terracotta: #C5563D;
  --color-terracotta-deep: #9B3F2A;
  --color-olive: #6B7B3F;
  --color-azur: #2E5C8A;
  --color-azur-deep: #1E3F62;
  --color-sand: #F4E8D8;
  --color-sand-warm: #EDD9BC;
  --color-cream: #FAF4EA;
  --color-jasmine: #FFF8E7;
  --color-gold: #D4A04C;
  --color-rose: #E8A598;
  --color-ink: #2A1F18;
  --color-ink-soft: #5A4A3F;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  background-color: var(--color-cream);
  color: var(--color-ink);
}
```

- [ ] **Étape 2 : Mettre à jour tailwind.config.ts (Tailwind v3 uniquement)**

Si v3, remplace tout `tailwind.config.ts` par :

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        terracotta: '#C5563D',
        'terracotta-deep': '#9B3F2A',
        olive: '#6B7B3F',
        azur: '#2E5C8A',
        'azur-deep': '#1E3F62',
        sand: '#F4E8D8',
        'sand-warm': '#EDD9BC',
        cream: '#FAF4EA',
        jasmine: '#FFF8E7',
        gold: '#D4A04C',
        rose: '#E8A598',
        ink: '#2A1F18',
        'ink-soft': '#5A4A3F',
      },
      fontFamily: {
        fraunces: ['var(--font-fraunces-var)', 'Georgia', 'serif'],
        manrope: ['var(--font-manrope-var)', 'system-ui', 'sans-serif'],
        caveat: ['var(--font-caveat-var)', 'cursive'],
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Étape 3 : Commit**

```bash
cd /c/khedhiri
git add src/app/globals.css tailwind.config.ts
git commit -m "feat: système de design — palette et fonts"
```

---

### Task 3 : Configurer layout.tsx avec Google Fonts

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Étape 1 : Remplacer layout.tsx**

Remplace tout le contenu de `src/app/layout.tsx` par :

```tsx
import type { Metadata } from 'next'
import { Fraunces, Manrope, Caveat } from 'next/font/google'
import './globals.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces-var',
  display: 'swap',
})

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope-var',
  display: 'swap',
})

const caveat = Caveat({
  subsets: ['latin'],
  variable: '--font-caveat-var',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'khedhiri.me — Notre famille',
  description: 'Notre petit monde entre Lisbonne et Tunis',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="fr"
      className={`${fraunces.variable} ${manrope.variable} ${caveat.variable}`}
    >
      <body className="font-manrope antialiased">
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Étape 2 : Vérifier la compilation TypeScript**

```bash
cd /c/khedhiri && npx tsc --noEmit
```

Résultat attendu : aucune erreur TypeScript.

- [ ] **Étape 3 : Commit**

```bash
cd /c/khedhiri
git add src/app/layout.tsx
git commit -m "feat: layout avec Google Fonts (Fraunces, Manrope, Caveat)"
```

---

### Task 4 : Écrire la page d'accueil

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Étape 1 : Remplacer page.tsx**

Remplace tout le contenu de `src/app/page.tsx` par :

```tsx
export default function AccueilPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <h1 className="font-fraunces text-6xl md:text-8xl text-terracotta mb-4 italic">
        khedhiri.me
      </h1>
      <p className="font-manrope text-lg md:text-xl text-ink-soft mb-8 max-w-md leading-relaxed">
        Bientôt, notre petit monde entre Lisbonne et Tunis
      </p>
      <p className="font-caveat text-2xl md:text-3xl text-gold">
        Pour Sandra, Sarah et Papa ♡
      </p>
    </main>
  )
}
```

- [ ] **Étape 2 : Vérifier visuellement en local**

```bash
cd /c/khedhiri && npm run dev
```

Ouvre http://localhost:3000 et vérifie :
- Fond crème ✓
- "khedhiri.me" en grand, italique, couleur terracotta, police serif élégante (Fraunces) ✓
- Sous-titre en Manrope ✓
- "Pour Sandra, Sarah et Papa ♡" en Caveat dorée ✓
- Responsive : redimensionne la fenêtre pour vérifier le mobile ✓

Arrête le serveur (Ctrl+C).

- [ ] **Étape 3 : Commit**

```bash
cd /c/khedhiri
git add src/app/page.tsx
git commit -m "feat: page d'accueil temporaire"
```

---

### Task 5 : Pousser sur GitHub

**Files:** aucun fichier modifié

- [ ] **Étape 1 : Vérifier que .gitignore protège les secrets**

```bash
grep "env" /c/khedhiri/.gitignore
```

Résultat attendu : `.env.local` apparaît dans la liste.

- [ ] **Étape 2 : Lier au repo GitHub et pousser**

```bash
cd /c/khedhiri
git remote add origin https://github.com/houssemeddin2/Khedhiri.git
git branch -M main
git push -u origin main
```

GitHub peut demander une authentification — une fenêtre s'ouvre dans le navigateur, suis les instructions.

- [ ] **Étape 3 : Vérifier sur GitHub**

Ouvre https://github.com/houssemeddin2/Khedhiri — tu dois voir tous les fichiers du projet (repo privé).

---

### Task 6 : Déployer sur Vercel *(étapes manuelles — Houssem)*

- [ ] **Étape 1 : Importer le projet**
  1. Va sur https://vercel.com/new
  2. Trouve `houssemeddin2/Khedhiri` dans la liste → clique **Import**
  3. Project Name : `khedhiri`
  4. Framework : Next.js (détecté automatiquement)
  5. Laisse tout le reste par défaut → clique **Deploy**
  6. Attends 1-2 minutes

- [ ] **Étape 2 : Vérifier le déploiement**

  Vercel affiche une URL du type `https://khedhiri-xxxx.vercel.app`. Ouvre-la — tu dois voir la page d'accueil. 🎉

---

### Task 7 : Configurer le domaine khedhiri.me *(étapes manuelles — Houssem)*

- [ ] **Étape 1 : Ajouter le domaine sur Vercel**
  1. Vercel → projet `khedhiri` → **Settings** → **Domains**
  2. Tape `khedhiri.me` → **Add**
  3. Tape `www.khedhiri.me` → **Add**
  4. Note les valeurs DNS affichées par Vercel

- [ ] **Étape 2 : Configurer les DNS chez OVH**
  1. https://ovh.com → connecte-toi
  2. **Web Cloud** → **Noms de domaine** → **khedhiri.me** → **Zone DNS**
  3. Enregistrement **A** : sous-domaine `@` → cible `76.76.21.21`
  4. Enregistrement **CNAME** : sous-domaine `www` → cible `cname.vercel-dns.com.` *(avec le point final)*
  5. ⚠️ Ne pas toucher aux enregistrements MX (ils servent aux emails @khedhiri.me)

- [ ] **Étape 3 : Attendre la propagation DNS**

  Surveille Vercel → Settings → Domains jusqu'à voir ✅ "Valid Configuration" (5 à 30 minutes).

- [ ] **Étape 4 : Tester le résultat final**

  Ouvre https://khedhiri.me — tu dois voir la page d'accueil. 🌟

---

### Task 8 : Finaliser

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Étape 1 : Mettre à jour le Journal des sessions dans CLAUDE.md**

Dans le tableau "Journal des sessions", remplace la ligne vide par :

```markdown
| Avril 2026 | Étape 1 | Next.js 15 initialisé, système de design configuré, déployé sur khedhiri.me |
```

- [ ] **Étape 2 : Commit et push final**

```bash
cd /c/khedhiri
git add CLAUDE.md
git commit -m "docs: étape 1 terminée — site déployé sur khedhiri.me"
git push
```

---

## Critères de succès

- [ ] http://localhost:3000 affiche la page d'accueil (fond crème, titre terracotta en Fraunces)
- [ ] https://github.com/houssemeddin2/Khedhiri existe et est privé
- [ ] Vercel déploie sans erreur de build
- [ ] https://khedhiri.me affiche la page d'accueil
- [ ] Les emails @khedhiri.me fonctionnent toujours (MX records intacts)
