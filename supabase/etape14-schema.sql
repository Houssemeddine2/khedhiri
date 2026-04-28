-- Étape 14 — Lettres pour leurs 18 ans

CREATE TABLE lettres (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  auteur_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  destinataire_id UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titre           TEXT        NOT NULL,
  contenu         TEXT        NOT NULL,
  unlock_at       TIMESTAMPTZ NOT NULL,
  notif_envoyee   BOOLEAN     NOT NULL DEFAULT false,
  lue_at          TIMESTAMPTZ NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE lettres ENABLE ROW LEVEL SECURITY;

-- Papa voit et modifie toutes ses lettres
CREATE POLICY "Auteur voit ses lettres"
  ON lettres FOR ALL
  USING (auth.uid() = auteur_id)
  WITH CHECK (auth.uid() = auteur_id);

-- Les filles voient leurs lettres (métadonnées + contenu filtré côté API)
CREATE POLICY "Destinataire voit ses lettres"
  ON lettres FOR SELECT
  USING (auth.uid() = destinataire_id);

-- Les filles peuvent marquer une lettre comme lue
CREATE POLICY "Destinataire peut marquer comme lue"
  ON lettres FOR UPDATE
  USING (auth.uid() = destinataire_id)
  WITH CHECK (auth.uid() = destinataire_id);
