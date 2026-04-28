-- supabase/etape15-schema.sql
-- Étape 15 : Bouton câlin virtuel + bibliothèque de vocaux préparés

-- Bibliothèque de vocaux préparés
CREATE TABLE IF NOT EXISTS vocaux (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proprietaire_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titre        TEXT NOT NULL,
  vocal_path   TEXT NOT NULL UNIQUE,
  duree_sec    INT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE vocaux ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Propriétaire gère ses vocaux"
  ON vocaux FOR ALL
  USING (auth.uid() = proprietaire_id)
  WITH CHECK (auth.uid() = proprietaire_id);

-- Câlins envoyés
CREATE TABLE IF NOT EXISTS calins (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expediteur_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  destinataire_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vocal_path      TEXT NOT NULL,
  titre           TEXT NOT NULL,
  envoye_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  ecoute_at       TIMESTAMPTZ NULL
);

ALTER TABLE calins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Expéditeur voit ses câlins envoyés"
  ON calins FOR SELECT
  USING (auth.uid() = expediteur_id);

CREATE POLICY "Destinataire voit ses câlins reçus"
  ON calins FOR SELECT
  USING (auth.uid() = destinataire_id);

-- INSERT et UPDATE ecoute_at via service role uniquement (pas de politique RLS user)
