# Étape 18 — Quiz et jeux personnalisés

## Contexte

N'importe quel membre peut créer un quiz avec plusieurs questions (QCM, Vrai/Faux, Questions ouvertes). Chaque quiz se joue en une seule session. Le score est calculé automatiquement pour QCM et Vrai/Faux. Le créateur peut valider les réponses ouvertes. Tout est intégré dans la page `/defis` existante, en troisième section scrollable "Quiz 🧩".

## Décisions de design

- **Créateurs** : tout le monde peut créer un quiz
- **Types de questions** : `qcm` (4 options, 1 bonne réponse), `vrai_faux`, `ouverte` (texte libre, validée par le créateur)
- **Session** : une seule par membre par quiz (`UNIQUE(quiz_id, membre_id)`) — soumission de toutes les réponses en une fois
- **Score** : calculé automatiquement pour qcm/vrai_faux, `correct` NULL pour ouverte jusqu'à validation créateur
- **Assignation** : `assignees UUID[]` vide = tout le monde, sinon liste ciblée
- **Point d'entrée** : section "Quiz 🧩" dans `/defis`, pas d'icône NavBar dédiée
- **Pas de Realtime actif** sur cette section (rechargement après chaque action)

## Architecture

```
[Membre crée quiz]        → POST /api/quizzes              → INSERT quizzes + questions_quiz
[Membre joue]             → GET /api/quizzes/[id]/questions → SELECT questions_quiz (lazy)
                          → POST /api/quizzes/[id]/session  → INSERT sessions_quiz + reponses_quiz
[Créateur valide réponse] → PATCH /api/quizzes/[id]/sessions/[sid]/reponses/[rid] → UPDATE reponses_quiz.correct

DefisPage (/defis)
  ├── Section "Défis & Mots 🎯" (existant)
  ├── Section "Lectures 📚" (étape 17)
  └── Section "Quiz 🧩" (nouveau)
       └── fetch GET /api/quizzes → QuizCard[]
```

## Base de données

```sql
CREATE TABLE IF NOT EXISTS quizzes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auteur_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titre       TEXT NOT NULL,
  description TEXT,
  assignees   UUID[] NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membres voient tous les quiz"
  ON quizzes FOR SELECT
  USING (auth.uid() IN (
    'b6025d5f-77d5-4208-b489-bcc717ebc01c',
    '1a0967e9-91e0-48f6-a3da-752255274153',
    '617eff77-47ed-40e0-b784-c027183c9bee'
  ));

CREATE POLICY "Auteur supprime son quiz"
  ON quizzes FOR DELETE
  USING (auth.uid() = auteur_id);

-- INSERT via service role uniquement

CREATE TABLE IF NOT EXISTS questions_quiz (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id       UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN ('qcm', 'vrai_faux', 'ouverte')),
  contenu       TEXT NOT NULL,
  options       TEXT[],
  bonne_reponse TEXT,
  ordre         INT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE questions_quiz ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membres voient toutes les questions quiz"
  ON questions_quiz FOR SELECT
  USING (auth.uid() IN (
    'b6025d5f-77d5-4208-b489-bcc717ebc01c',
    '1a0967e9-91e0-48f6-a3da-752255274153',
    '617eff77-47ed-40e0-b784-c027183c9bee'
  ));

-- INSERT via service role uniquement

CREATE TABLE IF NOT EXISTS sessions_quiz (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id      UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  membre_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score        INT NOT NULL DEFAULT 0,
  nb_questions INT NOT NULL,
  termine_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (quiz_id, membre_id)
);

ALTER TABLE sessions_quiz ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membres voient toutes les sessions"
  ON sessions_quiz FOR SELECT
  USING (auth.uid() IN (
    'b6025d5f-77d5-4208-b489-bcc717ebc01c',
    '1a0967e9-91e0-48f6-a3da-752255274153',
    '617eff77-47ed-40e0-b784-c027183c9bee'
  ));

-- INSERT via service role uniquement

CREATE TABLE IF NOT EXISTS reponses_quiz (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES sessions_quiz(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions_quiz(id) ON DELETE CASCADE,
  contenu     TEXT NOT NULL,
  correct     BOOL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, question_id)
);

ALTER TABLE reponses_quiz ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membres voient toutes les réponses quiz"
  ON reponses_quiz FOR SELECT
  USING (auth.uid() IN (
    'b6025d5f-77d5-4208-b489-bcc717ebc01c',
    '1a0967e9-91e0-48f6-a3da-752255274153',
    '617eff77-47ed-40e0-b784-c027183c9bee'
  ));

-- INSERT et UPDATE via service role uniquement (vérification créateur côté API pour PATCH)
```

**Contraintes métier :**
- `assignees = '{}'` signifie visible et applicable à tout le monde
- Une seule session par membre par quiz (`UNIQUE(quiz_id, membre_id)`)
- `options` : tableau de 2 à 4 éléments pour `qcm`, NULL pour `vrai_faux` et `ouverte`
- `bonne_reponse` : NULL pour `ouverte`, `"vrai"` ou `"faux"` pour `vrai_faux`
- `correct` : calculé serveur pour qcm/vrai_faux, NULL puis mis à jour par le créateur pour ouverte
- Score = nombre de `reponses_quiz.correct = true` pour la session

## API Routes

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/quizzes` | GET | Liste tous les quiz avec sessions + scores |
| `/api/quizzes` | POST | Crée un quiz avec ses questions |
| `/api/quizzes/[id]/questions` | GET | Questions d'un quiz (lazy-load) |
| `/api/quizzes/[id]/session` | POST | Soumet une session complète |
| `/api/quizzes/[id]/reponses-ouvertes` | GET | Réponses ouvertes non validées du quiz (créateur seulement) |
| `/api/quizzes/[id]/sessions/[sid]/reponses/[rid]` | PATCH | Créateur valide une réponse ouverte |

### GET `/api/quizzes`

Retourne tous les quiz triés par `created_at DESC`, limit 50, enrichis avec :
- `auteur_nom` + `auteur_email` (via `membreById`)
- `sessions` : tableau `[{ membre_id, membre_nom, membre_email, score, nb_questions, termine_at }]` pour les membres ayant joué
- `nb_questions` : count des questions
- `a_joue` : booléen pour l'utilisateur courant

Ne retourne pas les questions (lazy-load).

### POST `/api/quizzes`

Corps `application/json` :
```json
{
  "titre": "string",
  "description": "string (optionnel)",
  "assignees": ["uuid"] ,
  "questions": [
    {
      "type": "qcm",
      "contenu": "string",
      "options": ["A", "B", "C", "D"],
      "bonne_reponse": "A",
      "ordre": 1
    },
    {
      "type": "vrai_faux",
      "contenu": "string",
      "bonne_reponse": "vrai",
      "ordre": 2
    },
    {
      "type": "ouverte",
      "contenu": "string",
      "ordre": 3
    }
  ]
}
```

Validations : `titre` non vide, au moins 1 question, chaque question valide selon son type.
Insert quiz puis questions en deux étapes via service role.

### GET `/api/quizzes/[id]/questions`

Retourne les questions triées par `ordre ASC`. Pour les questions `ouverte`, `bonne_reponse` n'est pas retournée côté client (champ omis).

### POST `/api/quizzes/[id]/session`

Corps `application/json` :
```json
{
  "reponses": [
    { "question_id": "uuid", "contenu": "A" },
    { "question_id": "uuid", "contenu": "vrai" },
    { "question_id": "uuid", "contenu": "texte libre..." }
  ]
}
```

- Vérifie absence de session existante (`maybeSingle`)
- Calcule `correct` automatiquement pour `qcm` et `vrai_faux` (comparaison avec `bonne_reponse`)
- `correct = null` pour `ouverte`
- Calcule `score` = nb de `correct = true`
- Insert `sessions_quiz` puis `reponses_quiz` via service role
- Retourne `{ score, nb_questions, session_id }`

### GET `/api/quizzes/[id]/reponses-ouvertes`

- Vérifie que l'utilisateur courant est le créateur du quiz
- Retourne toutes les `reponses_quiz` de type `ouverte` où `correct IS NULL`, enrichies avec `question_contenu`, `membre_nom`, `membre_email`, `session_id`
- Retourne `{ reponses: ReponseOuverteAValider[] }`

### PATCH `/api/quizzes/[id]/sessions/[sid]/reponses/[rid]`

Corps `application/json` : `{ "correct": true | false }`

- Vérifie que l'utilisateur courant est le créateur du quiz
- Met à jour `reponses_quiz.correct`
- Met à jour `sessions_quiz.score` en recomptant (UPDATE score = count WHERE correct = true)

## Types TypeScript

```typescript
// src/types/quiz.ts

export interface SessionMembre {
  session_id: string
  membre_id: string
  membre_nom: string
  membre_email: string
  score: number
  nb_questions: number
  termine_at: string
}

export interface Quiz {
  id: string
  auteur_id: string
  auteur_nom: string
  auteur_email: string
  titre: string
  description: string | null
  assignees: string[]
  created_at: string
  sessions: SessionMembre[]
  nb_questions: number
  a_joue: boolean
}

export interface QuestionQuiz {
  id: string
  quiz_id: string
  type: 'qcm' | 'vrai_faux' | 'ouverte'
  contenu: string
  options: string[] | null
  ordre: number
}

export interface ReponseQuizInput {
  question_id: string
  contenu: string
}

export interface ReponseOuverteAValider {
  id: string
  session_id: string
  question_id: string
  question_contenu: string
  membre_nom: string
  membre_email: string
  contenu: string
  correct: boolean | null
}
```

## Composants

### `QuizSection` (Client Component)

Composant racine :
- Titre "Quiz 🧩" + bouton "+ Créer un quiz"
- `showCreer` state → affiche/cache `CreerQuiz`
- Liste de `QuizCard`
- `loadQuizzes` via GET `/api/quizzes` au mount + après chaque action

### `QuizCard` (Client Component)

- Titre + auteur + description + tempsRelatif
- Badges sessions des membres : `Sandra 4/5 ✅` ou `— pas encore joué`
- Si le membre courant n'a pas joué : bouton "Jouer" → toggle `showJouer`
- Si le membre courant a joué : son score affiché, pas de bouton Jouer
- Section `JouerQuiz` dépliable (lazy-load questions au premier clic)
- Si `auteur_id === currentUserId` et questions ouvertes non validées : section `ValiderReponses`

### `JouerQuiz` (Client Component)

- Reçoit `quizId`, `questions: QuestionQuiz[]`, `onTermine: () => void`
- State local : `reponses: Record<string, string>` (question_id → contenu)
- QCM : 4 boutons radio stylisés
- Vrai/Faux : 2 boutons "Vrai" / "Faux"
- Ouverte : textarea
- Bouton "Soumettre" (disabled si toutes les questions non répondues) → POST `/api/quizzes/[id]/session`
- Affiche score final après soumission : "Tu as eu X/Y ! 🎉"

### `CreerQuiz` (Client Component)

- Champs titre + description
- Section "Pour qui ?" : toggle Sandra / Sarah / Tout le monde
- Section "Questions" : liste de `QuestionForm` avec bouton "+ Ajouter une question"
- Chaque `QuestionForm` : sélecteur de type + champs selon le type + boutons ↑↓ + bouton supprimer
- Bouton "Publier" → POST `/api/quizzes`

### `ValiderReponses` (Client Component)

- Visible uniquement pour le créateur du quiz
- Charge GET `/api/quizzes/[id]/reponses-ouvertes` au montage (lazy, au premier affichage)
- Pour chaque réponse ouverte non validée : question + réponse du membre + boutons ✅ ❌ → PATCH `/api/quizzes/[id]/sessions/[sid]/reponses/[rid]`
- Recharge après chaque validation

### Modification de `DefisPage`

Ajouter après la section Lectures :
```tsx
<hr className="my-8 border-terracotta/20" />
<QuizSection userId={userId} />
```

## Fonctionnalités par rôle

| Fonctionnalité | Papa | Sandra | Sarah |
|---|---|---|---|
| Créer un quiz | ✅ | ✅ | ✅ |
| Jouer un quiz (une fois) | ✅ | ✅ | ✅ |
| Voir les scores de tous | ✅ | ✅ | ✅ |
| Valider les réponses ouvertes | créateur seulement | créateur seulement | créateur seulement |

## Contraintes

- Une seule session par membre par quiz (guard `maybeSingle` + UNIQUE constraint)
- `bonne_reponse` non exposée au client pour les questions ouvertes
- Score recalculé après chaque validation de réponse ouverte
- Pas de Realtime actif (rechargement après chaque action)
- Pas de pagination sur GET /api/quizzes (limit 50)
- Minimum 1 question par quiz, maximum non contraint
