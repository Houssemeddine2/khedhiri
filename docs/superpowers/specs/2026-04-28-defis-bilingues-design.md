# Étape 16 — Défis hebdomadaires + mots bilingues FR/AR

## Contexte

Tous les 3 membres (Papa, Sandra, Sarah) peuvent créer des défis ou poster des mots bilingues FR/AR. Les défis et mots apparaissent dans la timeline familiale comme des posts spéciaux, et une page dédiée `/defis` liste l'historique complet.

## Décisions de design

- **Créateurs** : tout le monde peut créer (pas réservé à Papa)
- **Réponses défis** : photo ou texte posté dans l'app, visible par tous — pas de validation formelle
- **Mots bilingues** : mini-quiz FR↔AR, réponse tapée + vérification immédiate côté serveur
- **Fréquence** : pas de cycle imposé, feed libre
- **Point d'entrée** : timeline familiale (pas d'icône NavBar dédiée) + page `/defis` pour l'historique complet

## Architecture

```
[Membre crée défi/mot] → POST /api/defis → INSERT defis
[Membre répond à défi] → POST /api/defis/[id]/reponses → INSERT reponses_defis
                                                         ↓ (si type='mot')
                                              Vérification traduction côté serveur
                                              → correct = true/false

Timeline page (/)
  ├── fetch posts (existant)
  ├── fetch defis récents (5 derniers)
  └── merge + sort by created_at → DefiCard / MotCard
```

## Base de données

```sql
-- Défis et mots bilingues
CREATE TABLE defis (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auteur_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type           TEXT NOT NULL CHECK (type IN ('defi', 'mot')),
  contenu        TEXT NOT NULL,         -- description du défi OU mot en français
  traduction_ar  TEXT,                  -- uniquement si type='mot'
  indice         TEXT,                  -- indice optionnel pour le quiz
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

-- Réponses aux défis (texte/photo) + tentatives de quiz
CREATE TABLE reponses_defis (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  defi_id    UUID NOT NULL REFERENCES defis(id) ON DELETE CASCADE,
  auteur_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contenu    TEXT NOT NULL,    -- texte libre OU réponse tapée (quiz)
  photo_path TEXT,             -- chemin Storage si réponse photo (défis seulement)
  correct    BOOLEAN,          -- uniquement pour type='mot', mis à jour via service role
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (defi_id, auteur_id)  -- une seule réponse/tentative par membre par défi
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

-- UPDATE et correction du champ 'correct' via service role uniquement (pas de RLS UPDATE user)
-- DELETE par l'auteur uniquement
CREATE POLICY "Auteur supprime sa réponse"
  ON reponses_defis FOR DELETE
  USING (auth.uid() = auteur_id);

-- Activer Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE defis;
```

**Storage :** bucket `defis` (public) pour les photos de réponses aux défis de type `'defi'`. Chemins : `reponses/[defi_id]/[uuid].jpg`.

**Contraintes métier :**
- `traduction_ar` requis si et seulement si `type = 'mot'`
- Une seule réponse/tentative par membre par défi (enforced par UNIQUE constraint)
- `correct` mis à jour via service role au moment de l'insert de la réponse quiz (pas de RLS UPDATE pour les membres)
- Réponses aux défis de type `'defi'` : `correct` reste NULL

## API Routes

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/defis` | GET | Liste tous les défis avec nb de réponses et réponse de l'utilisateur courant |
| `/api/defis` | POST | Crée un défi ou un mot bilingue |
| `/api/defis/[id]/reponses` | GET | Liste toutes les réponses à un défi (avec auteur) |
| `/api/defis/[id]/reponses` | POST | Poste une réponse (texte/photo pour défi, texte pour quiz mot) |

### GET `/api/defis`

Retourne tous les défis triés par `created_at DESC`, enrichis avec :
- `auteur_nom` + `auteur_email` (depuis `membreById`)
- `nb_reponses` (count des réponses)
- `ma_reponse` : la réponse de l'utilisateur courant si elle existe (pour savoir si déjà répondu)

### POST `/api/defis`

Corps `application/json` :
```json
{
  "type": "defi" | "mot",
  "contenu": "string",
  "traduction_ar": "string (requis si type=mot)",
  "indice": "string (optionnel)"
}
```

Validations : `type` ∈ ['defi', 'mot'], `contenu` non vide, `traduction_ar` présent si `type='mot'`.

### POST `/api/defis/[id]/reponses`

Accepte `multipart/form-data` :
- `contenu` (string) — texte de la réponse ou réponse quiz
- `photo` (fichier, optionnel) — uniquement pour défis de type `'defi'`

Traitement :
1. Vérifie que le défi existe et que l'utilisateur n'a pas déjà répondu (UNIQUE constraint)
2. Si `photo` fournie : upload dans `defis/reponses/[defi_id]/[uuid].jpg`
3. Si défi de type `'mot'` : compare `contenu.trim().toLowerCase()` à `traduction_ar.trim().toLowerCase()`, calcule `correct`
4. Insert via service role (pour pouvoir écrire `correct`)
5. Retourne `{ id, correct }` (`correct` = null pour les défis)

## Pages et composants

### `src/types/defi.ts`
```typescript
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
  nb_reponses: number
  ma_reponse: ReponseDefi | null
}

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
```

### `DefiCard` (Client Component)
Affiche un défi de type `'defi'` dans la timeline :
- En-tête : avatar auteur + nom + temps relatif + badge "🎯 Défi"
- Corps : texte du défi + photo d'illustration si présente
- Liste des réponses existantes (texte + photo si applicable) avec avatar auteur
- Si `ma_reponse === null` : formulaire inline "Répondre" (textarea + option upload photo + bouton Envoyer)
- Si `ma_reponse !== null` : affiche "✓ Tu as répondu" sans formulaire

### `MotCard` (Client Component)
Affiche un défi de type `'mot'` dans la timeline :
- En-tête : avatar auteur + nom + temps relatif + badge "🔤 Mot du jour"
- Corps : mot en français en grand (Fraunces), indice en petit si présent
- Si `ma_reponse === null` : champ input + bouton "Vérifier"
  - Après vérification : badge ✅ "Bravo !" ou ❌ "Pas tout à fait…" + révèle `traduction_ar`
- Si `ma_reponse !== null` : affiche la réponse donnée + badge ✅/❌ selon `correct` + traduction AR
- Affiche le score des autres membres (qui a trouvé ✅) en bas

### `CreerDefi` (Client Component)
Formulaire de création modale ou inline :
- Toggle "Défi" / "Mot bilingue"
- Si Défi : textarea description + upload photo optionnel
- Si Mot bilingue : champ "Mot en français" + champ "Traduction en arabe" + champ "Indice (optionnel)"
- Bouton "Publier" → POST `/api/defis`

### `DefisPage` (Client Component)
- Charge tous les défis via GET `/api/defis`
- Bouton "Créer un défi / mot" en haut → ouvre `CreerDefi`
- Feed de `DefiCard` + `MotCard` triés par `created_at DESC`
- Pas de Realtime sur cette page (l'utilisateur peut recharger manuellement)

### `src/app/defis/page.tsx` (Server Component)
- Auth guard, redirige vers `/login` si non authentifié
- Rend `<NavBar />` + `<DefisPage />`

### Intégration Timeline (`src/app/page.tsx`)
- Fetch des 5 derniers défis en plus des posts existants
- Fusion et tri par `created_at DESC` côté serveur (Server Component)
- Ajout d'un lien "Voir tous les défis →" pointant vers `/defis`
- Realtime : abonnement INSERT sur `defis` dans le composant client Timeline → recharge les défis récents

## Fonctionnalités par rôle

| Fonctionnalité | Papa | Sandra | Sarah |
|---|---|---|---|
| Créer un défi | ✅ | ✅ | ✅ |
| Créer un mot bilingue | ✅ | ✅ | ✅ |
| Répondre à un défi (texte/photo) | ✅ | ✅ | ✅ |
| Tenter un quiz mot | ✅ | ✅ | ✅ |
| Voir toutes les réponses | ✅ | ✅ | ✅ |
| Supprimer son défi/mot | ✅ | ✅ | ✅ |

## Contraintes

- Taille max photo réponse : 5 Mo
- Format accepté : JPEG/PNG/WebP
- Une seule réponse par membre par défi (UNIQUE constraint en base + guard API)
- `traduction_ar` requis côté API si `type='mot'`
- Pas de notification push (les défis sont visibles dans la timeline au quotidien)
- Vérification quiz insensible à la casse et aux espaces en début/fin
