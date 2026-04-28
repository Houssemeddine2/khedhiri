# Étape 17 — Lectures partagées + défis éducatifs

## Contexte

N'importe quel membre peut proposer un livre. Papa peut assigner une lecture à Sandra et/ou Sarah. Chaque livre permet de suivre l'avancement individuel (pas commencé / en cours / terminé) et d'accueillir des questions/défis éducatifs avec réponses. Tout est intégré dans la page `/defis` existante, en deuxième section scrollable "Lectures 📚".

## Décisions de design

- **Créateurs** : tout le monde peut ajouter un livre
- **Assignation** : champ `assignees UUID[]` — vide = tout le monde, sinon liste des UUIDs ciblés
- **Avancement** : personnel par membre, 3 états : `pas_commence` / `en_cours` / `termine`
- **Questions** : n'importe qui peut poster une question par livre ; une seule réponse par membre par question (UNIQUE constraint)
- **Couvertures** : URL externe (Google Books API) ou saisie manuelle — pas d'upload Storage
- **Point d'entrée** : section "Lectures 📚" dans `/defis`, pas d'icône NavBar dédiée
- **Pas de Realtime actif** sur cette section (la table est ajoutée à la publication pour usage futur, mais aucun composant ne s'y abonne — rechargement après chaque action)

## Architecture

```
[Membre crée lecture]    → POST /api/lectures           → INSERT lectures
[Membre met à jour]      → PATCH /api/lectures/[id]/avancement → UPSERT avancement_lecture
[Membre pose question]   → POST /api/lectures/[id]/questions   → INSERT questions_lecture
[Membre répond]          → POST /api/lectures/[id]/questions/[qid]/reponses → INSERT reponses_questions

Recherche couverture     → GET /api/google-books?q=...  → proxy Google Books API (public, sans clé)

DefisPage (/defis)
  ├── Section "Défis & Mots 🎯" (existant)
  └── Section "Lectures 📚" (nouveau)
       └── fetch GET /api/lectures → LectureCard[]
```

## Base de données

```sql
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

**Contraintes métier :**
- `assignees = '{}'` signifie visible et applicable à tout le monde
- UPSERT sur `avancement_lecture` : si une ligne existe déjà pour `(lecture_id, membre_id)`, on met à jour `statut` et `updated_at`
- Une seule réponse par membre par question (UNIQUE constraint)
- Pas de Storage bucket — les couvertures sont des URLs externes uniquement

## API Routes

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/lectures` | GET | Liste toutes les lectures avec avancements + nb questions |
| `/api/lectures` | POST | Crée une lecture |
| `/api/lectures/[id]/avancement` | PATCH | UPSERT avancement de l'utilisateur courant |
| `/api/lectures/[id]/questions` | GET | Liste questions + réponses d'un livre |
| `/api/lectures/[id]/questions` | POST | Crée une question sur un livre |
| `/api/lectures/[id]/questions/[qid]/reponses` | POST | Répond à une question |
| `/api/google-books` | GET | Proxy Google Books (`?q=titre`) |

### GET `/api/lectures`

Retourne toutes les lectures triées par `created_at DESC`, enrichies avec :
- `auteur_nom` + `auteur_email` (via `membreById`)
- `avancements` : tableau `[{ membre_id, membre_nom, membre_email, statut }]` pour les 3 membres (statut `pas_commence` si aucune ligne dans `avancement_lecture`)
- `nb_questions` : count des questions

**Ne retourne pas les questions** — chargées à la demande via GET `/api/lectures/[id]/questions` quand `LectureCard` ouvre son panneau.

### POST `/api/lectures`

Corps `application/json` :
```json
{
  "titre": "string",
  "auteur_livre": "string",
  "description": "string (optionnel)",
  "couverture_url": "string (optionnel)",
  "assignees": ["uuid", "uuid"] // optionnel, vide = tout le monde
}
```

Validations : `titre` et `auteur_livre` non vides.

### PATCH `/api/lectures/[id]/avancement`

Corps `application/json` : `{ "statut": "pas_commence" | "en_cours" | "termine" }`

UPSERT via service role : insert si absent, update si présent.

### POST `/api/lectures/[id]/questions`

Corps `application/json` : `{ "contenu": "string" }`

### POST `/api/lectures/[id]/questions/[qid]/reponses`

Corps `application/json` : `{ "contenu": "string" }`

Vérifie absence de réponse existante avant insert (maybeSingle check + UNIQUE constraint).

### GET `/api/google-books?q=...`

Appel vers `https://www.googleapis.com/books/v1/volumes?q={q}&maxResults=5&langRestrict=fr`

Retourne un tableau d'objets `{ titre, auteur, description, couverture_url }` — pas de clé API requise pour la recherche basique.

## Types TypeScript

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

## Composants

### `LectureCard` (Client Component)

Affiche un livre dans la section Lectures :
- Couverture (si présente) à gauche, titre + auteur à droite
- Badges d'avancement des 3 membres : `📖 en cours` / `✅ terminé` / `— pas commencé`
- Sélecteur "Mon avancement" : dropdown ou 3 boutons → PATCH `/api/lectures/[id]/avancement`
- Bouton "Questions (N)" → déplie la section questions (fetch lazy vers GET `/api/lectures/[id]/questions` au premier clic)
- Section dépliée : liste de `QuestionCard` + bouton "+ Poser une question" → `PosterQuestion`

### `QuestionCard` (Client Component)

- Affiche la question avec avatar auteur + temps relatif
- Liste des réponses avec avatars
- Si l'utilisateur courant n'a pas répondu : champ textarea + bouton "Répondre"
- Si déjà répondu : affiche la réponse + "✓ Tu as répondu"

### `AjouterLecture` (Client Component)

Formulaire de création affiché en haut de la section quand `showAjouter = true` :
- Champ recherche Google Books avec dropdown de résultats (5 max) → clic pré-remplit les champs
- Lien "Saisie manuelle" pour basculer en formulaire libre (titre + auteur + URL couverture + description)
- Champ "Pour qui ?" : boutons toggle Sandra / Sarah / Tout le monde
- Bouton "Ajouter" → POST `/api/lectures`

### `PosterQuestion` (Client Component)

Formulaire inline compact (textarea + bouton "Poster") → POST `/api/lectures/[id]/questions`

### `LecturesSection` (Client Component)

Composant racine de la section :
- Titre "Lectures 📚" + bouton "+ Ajouter un livre"
- `showAjouter` state → affiche/cache `AjouterLecture`
- Liste de `LectureCard` triées par `created_at DESC`
- `loadLectures` via GET `/api/lectures` au mount + après chaque action

### Modification de `DefisPage`

Ajouter `<LecturesSection userId={userId} />` après le feed des défis, séparé par un `<hr>` stylisé.

## Fonctionnalités par rôle

| Fonctionnalité | Papa | Sandra | Sarah |
|---|---|---|---|
| Ajouter un livre | ✅ | ✅ | ✅ |
| Assigner à quelqu'un | ✅ | ✅ | ✅ |
| Mettre à jour son avancement | ✅ | ✅ | ✅ |
| Poser une question | ✅ | ✅ | ✅ |
| Répondre à une question | ✅ | ✅ | ✅ |
| Voir tous les avancements | ✅ | ✅ | ✅ |

## Contraintes

- Pas de Realtime actif sur cette section (rechargement après chaque action suffit) — la publication est activée pour usage futur uniquement
- Couvertures : URL externe uniquement (Google Books ou saisie manuelle), max ~500 caractères
- Une seule réponse par membre par question (UNIQUE constraint en base + guard API)
- Recherche Google Books limitée à 5 résultats, filtrée sur `langRestrict=fr`
- Pas de pagination sur GET /api/lectures (limite 50, même approche que défis)
