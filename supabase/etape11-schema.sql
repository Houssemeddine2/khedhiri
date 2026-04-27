-- Étape 11 : Tuteur IA — sessions + messages

CREATE TABLE IF NOT EXISTS tutor_sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titre      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE tutor_sessions ENABLE ROW LEVEL SECURITY;

-- Filles voient leurs propres sessions ; Papa voit tout (via service_role côté serveur)
CREATE POLICY "tutor_sessions_own" ON tutor_sessions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS tutor_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES tutor_sessions(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content     TEXT NOT NULL,
  image_url   TEXT,              -- photo du cahier uploadée dans Supabase Storage
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE tutor_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tutor_messages_own" ON tutor_messages
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
