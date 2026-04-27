# Étape 8 — Espaces perso personnalisables

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** Chaque membre peut personnaliser son espace : photo de profil, couleur d'accent, bio. Pages de profil (`/profil` pour soi, `/profil/[userId]` pour voir les autres). Les avatars photos remplacent les initiales partout (PostCard, NavBar, etc.).

**Architecture:** ALTER TABLE `profiles` pour ajouter `avatar_url`, `couleur`, `bio`. Composant `AvatarCircle` partagé. `ProfilClient` gère l'édition (upload photo via `uploadMedia` existant + `updateProfil` server action). Pages profil : server component SSR + client wrapper.

**Tech Stack:** Next.js 15, Supabase (profiles table), `uploadMedia` server action existant.

---

## Fichiers

| Action | Fichier |
|--------|---------|
| Créer | `supabase/etape8-schema.sql` |
| Créer | `src/app/actions/profil.ts` |
| Créer | `src/components/ui/AvatarCircle.tsx` |
| Créer | `src/app/profil/page.tsx` |
| Créer | `src/components/profil/ProfilClient.tsx` |
| Créer | `src/app/profil/[userId]/page.tsx` |
| Modifier | `src/types/post.ts` — PostProfile + avatar_url/couleur |
| Modifier | `src/types/creation.ts` — profiles sub-type |
| Modifier | `src/components/timeline/PostCard.tsx` — AvatarCircle |
| Modifier | `src/components/album/PhotoGrid.tsx` — AvatarCircle |
| Modifier | `src/components/atelier/CreationCard.tsx` — AvatarCircle |
| Modifier | `src/components/NavBar.tsx` — lien profil + avatar propre |
| Modifier | `src/app/page.tsx` — select profiles(avatar_url, couleur) |
| Modifier | `src/app/album/page.tsx` — select profiles(avatar_url, couleur) |
| Modifier | `src/app/atelier/page.tsx` — select profiles(avatar_url, couleur) |
