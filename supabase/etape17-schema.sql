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
