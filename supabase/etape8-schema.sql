-- supabase/etape8-schema.sql
-- Personnalisation des profils : photo, couleur, bio

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS couleur    TEXT NOT NULL DEFAULT 'terracotta';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio        TEXT;

-- Couleurs par défaut pour chaque membre
UPDATE profiles SET couleur = 'azur'       WHERE email = 'houssem@khedhiri.me';
UPDATE profiles SET couleur = 'terracotta' WHERE email = 'sandra@khedhiri.me';
UPDATE profiles SET couleur = 'olive'      WHERE email = 'sarah@khedhiri.me';

-- Politique UPDATE : chaque utilisateur ne peut modifier que son propre profil
CREATE POLICY "Utilisateur peut modifier son profil" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
