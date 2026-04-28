-- supabase/etape18-schema.sql
-- Étape 18: Schéma SQL pour Quiz et Jeux personnalisés

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

-- INSERT et UPDATE du champ 'correct' via service role uniquement (vérification créateur côté API pour PATCH)
