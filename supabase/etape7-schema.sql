-- supabase/etape7-schema.sql
CREATE TABLE IF NOT EXISTS evenements (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  date        DATE        NOT NULL,
  description TEXT,
  color       TEXT        NOT NULL DEFAULT 'terracotta',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX evenements_date_idx ON evenements (date);
ALTER TABLE evenements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "famille peut voir les events"    ON evenements FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auteur peut créer un event"      ON evenements FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "auteur peut supprimer son event" ON evenements FOR DELETE USING (auth.uid() = author_id);
ALTER PUBLICATION supabase_realtime ADD TABLE evenements;

CREATE TABLE IF NOT EXISTS comptes_a_rebours (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  target_date DATE        NOT NULL,
  emoji       TEXT        NOT NULL DEFAULT '⏳',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE comptes_a_rebours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "famille peut voir les comptes"    ON comptes_a_rebours FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auteur peut créer un compte"      ON comptes_a_rebours FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "auteur peut supprimer son compte" ON comptes_a_rebours FOR DELETE USING (auth.uid() = author_id);
