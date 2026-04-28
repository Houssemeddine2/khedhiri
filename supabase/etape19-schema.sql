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
  UNIQUE (creation_id, membre_id)
);

ALTER TABLE reactions_creations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "famille voit les réactions créations"
  ON reactions_creations FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- INSERT et DELETE via service role uniquement
ALTER PUBLICATION supabase_realtime ADD TABLE reactions_creations;
