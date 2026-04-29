-- supabase/etape19-schema.sql

-- Étendre la table creations existante
ALTER TABLE creations ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'digital';
-- source : 'digital' (canvas Sarah) | 'upload' (photo dessin à la main)

-- Nouvelle table réactions sur les créations
CREATE TABLE IF NOT EXISTS reactions_creations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creation_id  UUID NOT NULL REFERENCES creations(id) ON DELETE CASCADE,
  membre_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji        TEXT NOT NULL CHECK (emoji IN ('❤️', '😍', '🎉')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (creation_id, membre_id, emoji)
);

ALTER TABLE reactions_creations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "famille voit les réactions créations"
  ON reactions_creations FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "membre peut réagir"
  ON reactions_creations FOR INSERT
  WITH CHECK (auth.uid() = membre_id);

CREATE POLICY "membre peut retirer sa réaction"
  ON reactions_creations FOR DELETE
  USING (auth.uid() = membre_id);

CREATE INDEX reactions_creations_creation_idx ON reactions_creations (creation_id);

ALTER PUBLICATION supabase_realtime ADD TABLE reactions_creations;
