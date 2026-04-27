-- Étape 10 : Journaux intimes chiffrés côté client

CREATE TABLE IF NOT EXISTS journal_profils (
  user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  salt        TEXT NOT NULL,         -- PBKDF2 salt (base64) — stocké en clair
  indice      TEXT,                  -- aide-mémoire du mot de passe (optionnel)
  check_cipher TEXT NOT NULL,        -- AES-GCM("khedhiri-journal-ok", key) pour vérifier le mdp
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE journal_profils ENABLE ROW LEVEL SECURITY;

CREATE POLICY "journal_profils_own" ON journal_profils
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS journal_entrees (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titre_cipher   TEXT,               -- titre chiffré (peut être null = sans titre)
  contenu_cipher TEXT NOT NULL,      -- contenu chiffré (AES-GCM base64 JSON)
  date           DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE journal_entrees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "journal_entrees_own" ON journal_entrees
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
