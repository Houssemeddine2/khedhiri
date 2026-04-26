-- supabase/etape3-schema.sql
-- À copier-coller dans : Supabase Dashboard → SQL Editor → New query

-- ─── TABLES ─────────────────────────────────────────────────────────────────

create table profiles (
  id   uuid primary key references auth.users on delete cascade,
  email text unique not null,
  nom   text not null,
  created_at timestamptz default now()
);

create table posts (
  id             uuid primary key default gen_random_uuid(),
  author_id      uuid references auth.users on delete cascade not null,
  type           text not null check (type in ('text', 'photo', 'audio')),
  content        text,
  media_url      text,
  audio_duration integer check (audio_duration is null or audio_duration > 0),
  created_at     timestamptz default now() not null,
  constraint posts_type_data_coherence check (
    (type = 'text'  and content   is not null) or
    (type in ('photo', 'audio') and media_url is not null)
  )
);

create table reactions (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid references posts on delete cascade not null,
  user_id    uuid references auth.users on delete cascade not null,
  emoji      text not null,
  created_at timestamptz default now() not null,
  unique (post_id, user_id)
);

-- ─── ROW LEVEL SECURITY ─────────────────────────────────────────────────────

alter table profiles  enable row level security;
alter table posts     enable row level security;
alter table reactions enable row level security;

create policy "Famille peut lire profils"    on profiles  for select to authenticated using (true);
create policy "Famille peut lire posts"      on posts     for select to authenticated using (true);
create policy "Famille peut créer posts"     on posts     for insert to authenticated with check (auth.uid() = author_id);
create policy "Auteur peut supprimer post"   on posts     for delete to authenticated using (auth.uid() = author_id);
create policy "Famille peut lire réactions"  on reactions for select to authenticated using (true);
create policy "Famille peut réagir"          on reactions for insert to authenticated with check (auth.uid() = user_id);
create policy "Auteur peut changer réaction" on reactions for update to authenticated using (auth.uid() = user_id);
create policy "Auteur peut retirer réaction" on reactions for delete to authenticated using (auth.uid() = user_id);

-- ─── PROFILS DES 3 MEMBRES ───────────────────────────────────────────────────

insert into profiles (id, email, nom) values
  ('b6025d5f-77d5-4208-b489-bcc717ebc01c', 'houssem@khedhiri.me', 'Houssem'),
  ('1a0967e9-91e0-48f6-a3da-752255274153', 'sandra@khedhiri.me',  'Sandra'),
  ('617eff77-47ed-40e0-b784-c027183c9bee', 'sarah@khedhiri.me',   'Sarah')
on conflict (id) do nothing;

-- ─── REALTIME ────────────────────────────────────────────────────────────────

alter publication supabase_realtime add table posts;
alter publication supabase_realtime add table reactions;

-- ─── STORAGE ─────────────────────────────────────────────────────────────────

-- Note : bucket public pour simplicité (URLs non-devinables via UUID).
-- Passer à public: false + signed URLs si la confidentialité doit être renforcée.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  52428800,
  array['image/jpeg','image/png','image/webp','image/gif','image/heic',
        'audio/webm','audio/mp4','audio/ogg','audio/mpeg']
) on conflict (id) do nothing;

create policy "Famille peut uploader" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media');

create policy "Public peut lire media" on storage.objects
  for select using (bucket_id = 'media');

create policy "Auteur peut supprimer media" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and auth.uid()::text = (storage.foldername(name))[1]);
