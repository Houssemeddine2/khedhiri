-- Étape 13 — Client email
-- Table pour stocker les mots de passe email OVH chiffrés (AES-256-GCM)

CREATE TABLE email_credentials (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE email_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Credentials personnels"
  ON email_credentials
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
