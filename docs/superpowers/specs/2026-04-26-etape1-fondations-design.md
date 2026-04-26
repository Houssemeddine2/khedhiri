# Spec — Étape 1 : Fondations Next.js + Déploiement

**Date** : 2026-04-26  
**Approche retenue** : Option C — Fondations visuelles réutilisables

---

## 1. Initialisation du projet

- Commande : `npx create-next-app@latest .` dans `C:\khedhiri`
- Options : TypeScript, Tailwind CSS, App Router, ESLint, dossier `src/`, alias `@/*`, Turbopack
- Nom dans `package.json` : `khedhiri`
- Les fichiers existants (`docs/`, `CLAUDE.md`) sont préservés

## 2. Système de design

### `src/app/globals.css`
Variables CSS définissant toute la palette :

```css
--terracotta: #C5563D
--terracotta-deep: #9B3F2A
--olive: #6B7B3F
--azur: #2E5C8A
--azur-deep: #1E3F62
--sand: #F4E8D8
--sand-warm: #EDD9BC
--cream: #FAF4EA
--jasmine: #FFF8E7
--gold: #D4A04C
--rose: #E8A598
--ink: #2A1F18
--ink-soft: #5A4A3F
```

### `tailwind.config.ts`
Extension du thème Tailwind avec les couleurs ci-dessus en classes utilitaires (`bg-cream`, `text-terracotta`, etc.) + déclaration des 3 fonts via variables CSS.

### `src/app/layout.tsx`
Chargement Google Fonts :
- **Fraunces** — display/titres (variable `--font-fraunces`)
- **Manrope** — texte courant (variable `--font-manrope`)
- **Caveat** — manuscrit/poétique (variable `--font-caveat`)

Metadata globale : lang `fr`, viewport mobile-first.

## 3. Page d'accueil temporaire

**Fichier** : `src/app/page.tsx`

Contenu :
- `<title>` et metadata : "khedhiri.me — Notre famille"
- Fond : `bg-cream`
- Titre : "khedhiri.me" — Fraunces, grande taille, `text-terracotta`
- Sous-titre : "Bientôt, notre petit monde entre Lisbonne et Tunis" — Manrope
- Mention : "Pour Sandra, Sarah et Papa ♡" — Caveat

Design : centré, mobile-first, pas d'images (page légère et rapide).

## 4. GitHub

- Repo : `houssemeddin2/Khedhiri` (privé)
- Commit initial : `"Initial commit — fondations du projet familial"`
- Branch principale : `main`

## 5. Vercel (manuel par Houssem)

- Import du repo `houssemeddin2/Khedhiri` depuis https://vercel.com/new
- Nom du projet Vercel : `khedhiri`
- Framework : Next.js (détecté auto)
- Déploiement auto à chaque push sur `main`

## 6. DNS OVH (manuel par Houssem)

- Enregistrement **A** : `@` → `76.76.21.21`
- Enregistrement **CNAME** : `www` → `cname.vercel-dns.com.`
- ⚠️ Ne pas toucher aux MX records (emails @khedhiri.me)

## 7. Critères de succès

- [ ] `http://localhost:3000` affiche la page d'accueil en local
- [ ] Le repo est visible sur `github.com/houssemeddin2/Khedhiri` (privé)
- [ ] Vercel déploie sans erreur
- [ ] `https://khedhiri.me` affiche la page d'accueil
- [ ] Les emails `@khedhiri.me` fonctionnent toujours

## 8. Ce que Claude fait vs Houssem

| Tâche | Qui |
|-------|-----|
| Créer le projet Next.js | Claude |
| Configurer palette + fonts + Tailwind | Claude |
| Écrire la page d'accueil | Claude |
| Commit + push GitHub | Claude |
| Importer sur Vercel | Houssem |
| Configurer DNS OVH | Houssem |
