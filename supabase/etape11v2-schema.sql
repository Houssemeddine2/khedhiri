-- supabase/etape11v2-schema.sql

-- Credentials Pronote + colonne notification dans profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS pronote_url                   TEXT,
  ADD COLUMN IF NOT EXISTS pronote_username              TEXT,
  ADD COLUMN IF NOT EXISTS pronote_password_encrypted    TEXT,
  ADD COLUMN IF NOT EXISTS last_tutor_unavail_notif_at   TIMESTAMPTZ;

-- Notes Pronote
CREATE TABLE IF NOT EXISTS pronote_notes (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users NOT NULL,
  matiere     TEXT NOT NULL,
  note        NUMERIC(5,2),
  note_max    NUMERIC(5,2) DEFAULT 20,
  date        DATE NOT NULL,
  commentaire TEXT,
  synced_at   TIMESTAMPTZ DEFAULT now()
);

-- Devoirs
CREATE TABLE IF NOT EXISTS pronote_devoirs (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users NOT NULL,
  matiere      TEXT NOT NULL,
  description  TEXT NOT NULL,
  date_rendu   DATE NOT NULL,
  fait         BOOLEAN DEFAULT false,
  synced_at    TIMESTAMPTZ DEFAULT now()
);

-- Absences
CREATE TABLE IF NOT EXISTS pronote_absences (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users NOT NULL,
  date_debut  TIMESTAMPTZ NOT NULL,
  date_fin    TIMESTAMPTZ NOT NULL,
  justifiee   BOOLEAN DEFAULT false,
  cours       TEXT,
  synced_at   TIMESTAMPTZ DEFAULT now()
);

-- Observations des professeurs
CREATE TABLE IF NOT EXISTS pronote_observations (
  id        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id   UUID REFERENCES auth.users NOT NULL,
  prof      TEXT,
  matiere   TEXT,
  contenu   TEXT NOT NULL,
  date      DATE NOT NULL,
  synced_at TIMESTAMPTZ DEFAULT now()
);

-- Événements scolaires
CREATE TABLE IF NOT EXISTS pronote_evenements (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users NOT NULL,
  titre       TEXT NOT NULL,
  type        TEXT,
  date_debut  TIMESTAMPTZ NOT NULL,
  date_fin    TIMESTAMPTZ,
  synced_at   TIMESTAMPTZ DEFAULT now()
);

-- Analyses de sessions par Ollama
CREATE TABLE IF NOT EXISTS tutor_analyses (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id          UUID REFERENCES tutor_sessions(id) ON DELETE CASCADE,
  user_id             UUID REFERENCES auth.users NOT NULL,
  matiere             TEXT,
  sujets              TEXT[],
  difficulte          INTEGER CHECK (difficulte BETWEEN 1 AND 3),
  points_forts        TEXT,
  points_retravailler TEXT,
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE pronote_notes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE pronote_devoirs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE pronote_absences     ENABLE ROW LEVEL SECURITY;
ALTER TABLE pronote_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pronote_evenements   ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_analyses       ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pronote_notes' AND policyname='lecture') THEN
    CREATE POLICY lecture ON pronote_notes FOR SELECT USING (auth.uid() = user_id OR auth.uid() = 'b6025d5f-77d5-4208-b489-bcc717ebc01c');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pronote_notes' AND policyname='insert_service') THEN
    CREATE POLICY insert_service ON pronote_notes FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pronote_devoirs' AND policyname='lecture') THEN
    CREATE POLICY lecture ON pronote_devoirs FOR SELECT USING (auth.uid() = user_id OR auth.uid() = 'b6025d5f-77d5-4208-b489-bcc717ebc01c');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pronote_devoirs' AND policyname='insert_service') THEN
    CREATE POLICY insert_service ON pronote_devoirs FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pronote_absences' AND policyname='lecture') THEN
    CREATE POLICY lecture ON pronote_absences FOR SELECT USING (auth.uid() = user_id OR auth.uid() = 'b6025d5f-77d5-4208-b489-bcc717ebc01c');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pronote_absences' AND policyname='insert_service') THEN
    CREATE POLICY insert_service ON pronote_absences FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pronote_observations' AND policyname='lecture') THEN
    CREATE POLICY lecture ON pronote_observations FOR SELECT USING (auth.uid() = user_id OR auth.uid() = 'b6025d5f-77d5-4208-b489-bcc717ebc01c');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pronote_observations' AND policyname='insert_service') THEN
    CREATE POLICY insert_service ON pronote_observations FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pronote_evenements' AND policyname='lecture') THEN
    CREATE POLICY lecture ON pronote_evenements FOR SELECT USING (auth.uid() = user_id OR auth.uid() = 'b6025d5f-77d5-4208-b489-bcc717ebc01c');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pronote_evenements' AND policyname='insert_service') THEN
    CREATE POLICY insert_service ON pronote_evenements FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='tutor_analyses' AND policyname='lecture') THEN
    CREATE POLICY lecture ON tutor_analyses FOR SELECT USING (auth.uid() = user_id OR auth.uid() = 'b6025d5f-77d5-4208-b489-bcc717ebc01c');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='tutor_analyses' AND policyname='insert_service') THEN
    CREATE POLICY insert_service ON tutor_analyses FOR INSERT WITH CHECK (true);
  END IF;
END $$;
