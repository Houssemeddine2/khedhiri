-- supabase/etape4-schema.sql
-- Étape 4 : Chats individuels bilatéraux

-- Table des messages privés
CREATE TABLE messages (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id TEXT        NOT NULL,
  sender_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type            TEXT        NOT NULL CHECK (type IN ('text', 'photo', 'audio')),
  content         TEXT,
  media_url       TEXT,
  audio_duration  INTEGER     CHECK (audio_duration IS NULL OR audio_duration > 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT messages_content_coherence CHECK (
    (type = 'text'  AND content IS NOT NULL AND media_url IS NULL) OR
    (type IN ('photo', 'audio') AND media_url IS NOT NULL AND content IS NULL)
  )
);

CREATE INDEX messages_conversation_idx ON messages (conversation_id, created_at);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Les 2 participants peuvent lire leurs messages
-- conversation_id = [uid1, uid2].sort().join('_')
CREATE POLICY "participants peuvent lire" ON messages
  FOR SELECT USING (
    auth.uid()::text = split_part(conversation_id, '_', 1) OR
    auth.uid()::text = split_part(conversation_id, '_', 2)
  );

-- Seul le sender peut insérer, et il doit être participant
CREATE POLICY "participants peuvent envoyer" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND (
      auth.uid()::text = split_part(conversation_id, '_', 1) OR
      auth.uid()::text = split_part(conversation_id, '_', 2)
    )
  );

-- Seul l'auteur peut supprimer ses messages
CREATE POLICY "auteur peut supprimer" ON messages
  FOR DELETE USING (auth.uid() = sender_id);

-- Activation Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
