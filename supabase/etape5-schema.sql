-- supabase/etape5-schema.sql
-- Table des abonnements push Web (1 ligne = 1 navigateur/appareil)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint   TEXT        NOT NULL UNIQUE,
  p256dh     TEXT        NOT NULL,
  auth       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX push_subscriptions_user_idx ON push_subscriptions (user_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- L'utilisateur peut enregistrer son propre abonnement
CREATE POLICY "utilisateur peut enregistrer" ON push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- L'utilisateur peut supprimer ses propres abonnements
CREATE POLICY "utilisateur peut supprimer" ON push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- Pas de politique SELECT pour auth/anon :
-- la lecture se fait exclusivement via service_role (push-server.ts)
