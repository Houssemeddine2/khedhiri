# Spec — Étape 2 : Authentification + 3 comptes

**Date** : 2026-04-26
**Approche retenue** : Middleware Next.js + Supabase SSR (Option A)

---

## 1. Objectif

Mettre en place l'authentification email/mot de passe pour les 3 membres de la famille. Seuls Houssem, Sandra et Sarah peuvent accéder à l'application. Toutes les routes sont protégées sauf `/login`.

## 2. Architecture

### Clients Supabase

Deux clients distincts selon le contexte d'exécution :

- **`src/lib/supabase/server.ts`** — client côté serveur (Server Components, Server Actions, middleware). Utilise `@supabase/ssr` avec les cookies Next.js.
- **`src/lib/supabase/client.ts`** — client côté navigateur (Client Components). Instance singleton.

### Middleware

- **`src/middleware.ts`** — intercepte toutes les requêtes
- Vérifie la session Supabase via le client serveur
- Redirige vers `/login` si non authentifié
- Redirige vers `/` si déjà authentifié et tentative d'accès à `/login`
- Routes publiques : `/login` uniquement

### Routes

| Route | Accès | Description |
|-------|-------|-------------|
| `/login` | Public | Page de connexion |
| `/` | Protégé | Placeholder "Bienvenue" (remplacé à l'étape 3) |
| Toute autre route | Protégé | Redirige vers `/login` |

## 3. Page de login (`/login`)

**Style** : centré, minimaliste, fond crème — cohérent avec le design system.

**Contenu visuel :**
- Titre "khedhiri.me" en Fraunces italique terracotta (grande taille)
- Sous-titre "Notre petit monde ♡" en Caveat doré
- Carte blanche (shadow douce, border-radius 16px) contenant :
  - Champ email (label uppercase, fond sand `#F4E8D8`)
  - Champ mot de passe (même style)
  - Bouton "Entrer" terracotta pleine largeur
- "Pour Sandra, Sarah et Papa ♡" en Caveat gris doux en bas de page
- **Pas de lien "créer un compte"** (application privée)

**Comportements :**
- Formulaire soumis via Server Action (`src/app/login/actions.ts`)
- Message d'erreur discret si identifiants incorrects ("Email ou mot de passe incorrect")
- Après login réussi → redirect vers `/`
- Si déjà connecté → middleware redirige directement vers `/`
- Bouton et champs avec taille confortable (accessibilité mobile, pour Sarah)

## 4. Page d'accueil protégée (placeholder)

**Fichier** : `src/app/page.tsx` — remplace la page "coming soon" actuelle.

**Contenu :**
- "Bonjour [prénom] ♡" en Fraunces terracotta
- Courte phrase chaleureuse selon le membre connecté
- Bouton "Se déconnecter" (Server Action logout)
- Fond crème, même style que la page de login

Le prénom est récupéré depuis `user.email` (ex: `houssem@khedhiri.me` → "Houssem").

## 5. Comptes utilisateurs

**Méthode** : création manuelle dans le dashboard Supabase (étape manuelle pour Houssem).

| Membre | Email | Rôle |
|--------|-------|------|
| Houssem | houssem@khedhiri.me | admin |
| Sandra | sandra@khedhiri.me | enfant |
| Sarah | sarah@khedhiri.me | enfant |

Les mots de passe sont choisis par Houssem directement dans le dashboard Supabase. Pas de système de rôles côté code à cette étape (ajouté à l'étape 8 — espaces perso).

## 6. Variables d'environnement

**Fichier local** : `.env.local` (déjà dans `.gitignore`)

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Ces mêmes variables sont ajoutées manuellement sur Vercel (Settings → Environment Variables) pour que le déploiement fonctionne.

## 7. Packages à installer

```bash
npm install @supabase/supabase-js @supabase/ssr
```

## 8. Fichiers créés / modifiés

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/lib/supabase/server.ts` | Créer | Client Supabase serveur |
| `src/lib/supabase/client.ts` | Créer | Client Supabase navigateur |
| `src/middleware.ts` | Créer | Protection des routes |
| `src/app/login/page.tsx` | Créer | Page de connexion |
| `src/app/login/actions.ts` | Créer | Server Actions login/logout |
| `src/app/page.tsx` | Modifier | Page bienvenue protégée |
| `.env.local` | Créer | Variables Supabase (non commité) |

## 9. Ce que Claude fait vs Houssem

| Tâche | Qui |
|-------|-----|
| Installer les packages Supabase | Claude |
| Créer les clients Supabase | Claude |
| Écrire le middleware | Claude |
| Écrire la page de login | Claude |
| Écrire les Server Actions | Claude |
| Mettre à jour page.tsx | Claude |
| Créer le projet Supabase | Houssem |
| Créer les 3 comptes dans le dashboard | Houssem |
| Copier les env vars dans `.env.local` | Houssem |
| Ajouter les env vars sur Vercel | Houssem |

## 10. Critères de succès

- [ ] `http://localhost:3000` redirige vers `/login` si non connecté
- [ ] Login avec houssem@khedhiri.me fonctionne → page "Bonjour Houssem"
- [ ] Login avec sandra@khedhiri.me fonctionne → page "Bonjour Sandra"
- [ ] Login avec sarah@khedhiri.me fonctionne → page "Bonjour Sarah"
- [ ] Déconnexion fonctionne → retour vers `/login`
- [ ] URL directe vers `/` sans session → redirige vers `/login`
- [ ] `https://khedhiri.me` fonctionne en production (env vars Vercel)
