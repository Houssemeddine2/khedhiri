-- supabase/etape16-schema.sql
-- Étape 16 : Défis hebdomadaires + mots bilingues FR/AR

CREATE TABLE IF NOT EXISTS defis (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auteur_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type           TEXT NOT NULL CHECK (type IN ('defi', 'mot')),
  contenu        TEXT NOT NULL,
  traduction_ar  TEXT,
  indice         TEXT,
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

CREATE POLICY "Auteur modifie son défi"
  ON defis FOR UPDATE
  USING (auth.uid() = auteur_id)
  WITH CHECK (auth.uid() = auteur_id);

CREATE POLICY "Auteur supprime son défi"
  ON defis FOR DELETE
  USING (auth.uid() = auteur_id);

CREATE TABLE IF NOT EXISTS reponses_defis (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  defi_id    UUID NOT NULL REFERENCES defis(id) ON DELETE CASCADE,
  auteur_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contenu    TEXT NOT NULL,
  photo_path TEXT,
  correct    BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (defi_id, auteur_id)
);

ALTER TABLE reponses_defis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membres voient toutes les réponses"
  ON reponses_defis FOR SELECT
  USING (auth.uid() IN (
    'b6025d5f-77d5-4208-b489-bcc717ebc01c',
    '1a0967e9-91e0-48f6-a3da-752255274153',
    '617eff77-47ed-40e0-b784-c027183c9bee'
  ));

CREATE POLICY "Auteur supprime sa réponse"
  ON reponses_defis FOR DELETE
  USING (auth.uid() = auteur_id);

-- INSERT et UPDATE du champ 'correct' via service role uniquement
ALTER PUBLICATION supabase_realtime ADD TABLE defis;
