-- supabase/etape6-schema.sql
CREATE TABLE IF NOT EXISTS creations (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      TEXT,
  media_url  TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX creations_author_idx ON creations (author_id, created_at);

ALTER TABLE creations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "famille peut voir" ON creations
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "auteur peut créer" ON creations
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "auteur peut supprimer" ON creations
  FOR DELETE USING (auth.uid() = author_id);

ALTER PUBLICATION supabase_realtime ADD TABLE creations;
