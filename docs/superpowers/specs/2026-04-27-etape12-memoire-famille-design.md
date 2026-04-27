# Étape 12 — Boîte à mémoire + Arbre généalogique

## Décisions de design

- **Deux pages séparées** : `/memoire` et `/famille` — chaque fonctionnalité a son espace dédié
- **Boîte à mémoire** : mur de polaroïds (rotation fixe par seed), partagé par toute la famille
- **Arbre généalogique** : cartes détaillées cliquables groupées par génération, deux côtés (Khedhiri + maternel)
- **Tous peuvent contribuer** : ajouter souvenirs et membres de famille, Papa peut supprimer/modifier

---

## 1. Boîte à mémoire (`/memoire`)

### Fonctionnalités
- Ajouter un souvenir avec : titre, texte libre, photo, audio, dessin (depuis l'atelier créatif de Sarah)
- Mur de polaroïds avec légère rotation déterministe (seed basé sur `id`)
- Filtres par type : 📸 Photos · 🎵 Vocaux · 🎨 Dessins · ✍️ Textes
- Clic sur un polaroïd → modal avec détail complet (auteur, date, contenu)
- Papa peut supprimer n'importe quel souvenir ; les filles uniquement les leurs

### Schéma SQL
```sql
create table memoires (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  titre text not null,
  texte text,
  photo_url text,
  audio_url text,
  creation_id uuid references creations(id) on delete set null,
  date_souvenir date not null default current_date,
  created_at timestamptz default now()
);

alter table memoires enable row level security;

-- Lecture : tous les membres authentifiés
create policy "lecture memoires" on memoires
  for select using (auth.uid() is not null);

-- Insertion : tous les membres authentifiés
create policy "insertion memoires" on memoires
  for insert with check (auth.uid() = user_id);

-- Suppression : auteur ou Papa
create policy "suppression memoires" on memoires
  for delete using (
    auth.uid() = user_id
    or auth.uid() = 'b6025d5f-77d5-4208-b489-bcc717ebc01c'
  );
```

### Storage
- Bucket Supabase : `memoires` (public)
- Chemins : `photos/{user_id}/{uuid}` et `audios/{user_id}/{uuid}`

### Composants
- `src/app/memoire/page.tsx` — page serveur, fetch initial des souvenirs
- `src/components/memoire/MurSouvenirs.tsx` — grille de polaroïds, filtres, état client
- `src/components/memoire/PolaroidCard.tsx` — carte individuelle avec rotation déterministe
- `src/components/memoire/AjouterSouvenir.tsx` — modal/drawer d'ajout (formulaire)
- `src/components/memoire/SouvenirDetail.tsx` — modal de détail au clic

---

## 2. Arbre généalogique (`/famille`)

### Fonctionnalités
- Grille de cartes par génération, avec deux onglets : **Côté Khedhiri (Papa)** / **Côté Maternel**
- Chaque carte : photo ou avatar emoji, prénom, relation, lieu
- Clic → modal avec bio complète et anecdotes
- Tous peuvent ajouter un membre (insert)
- Papa peut modifier et supprimer ; les filles ajoutent uniquement
- Les filles peuvent écrire des anecdotes sur n'importe quel membre

### Schéma SQL
```sql
create table famille_membres (
  id uuid primary key default gen_random_uuid(),
  prenom text not null,
  nom text,
  surnom text,
  photo_url text,
  date_naissance date,
  lieu_naissance text,
  cote text not null check (cote in ('khedhiri', 'maternel')),
  relation text not null,
  generation int not null default 0,
  bio text,
  created_by uuid references auth.users not null,
  created_at timestamptz default now()
);

alter table famille_membres enable row level security;

-- Lecture : tous
create policy "lecture famille" on famille_membres
  for select using (auth.uid() is not null);

-- Insertion : tous
create policy "insertion famille" on famille_membres
  for insert with check (auth.uid() is not null);

-- Update/Delete : Papa uniquement
create policy "modification famille" on famille_membres
  for update using (auth.uid() = 'b6025d5f-77d5-4208-b489-bcc717ebc01c');

create policy "suppression famille" on famille_membres
  for delete using (auth.uid() = 'b6025d5f-77d5-4208-b489-bcc717ebc01c');
```

### Schéma SQL — anecdotes (table séparée pour permettre aux filles d'écrire)
```sql
create table famille_anecdotes (
  id uuid primary key default gen_random_uuid(),
  membre_id uuid references famille_membres(id) on delete cascade not null,
  user_id uuid references auth.users not null,
  contenu text not null,
  created_at timestamptz default now()
);

alter table famille_anecdotes enable row level security;

create policy "lecture anecdotes" on famille_anecdotes
  for select using (auth.uid() is not null);

create policy "insertion anecdotes" on famille_anecdotes
  for insert with check (auth.uid() = user_id);

create policy "suppression anecdotes" on famille_anecdotes
  for delete using (
    auth.uid() = user_id
    or auth.uid() = 'b6025d5f-77d5-4208-b489-bcc717ebc01c'
  );
```

### Storage
- Bucket Supabase : `famille` (public)
- Chemin : `photos/{membre_id}`

### Composants
- `src/app/famille/page.tsx` — page serveur, fetch initial des membres + anecdotes
- `src/components/famille/ArbreGenealogique.tsx` — grille principale + onglets côtés
- `src/components/famille/MembreCard.tsx` — carte cliquable (photo, prénom, relation)
- `src/components/famille/MembreDetail.tsx` — modal de détail avec bio et anecdotes (liste)
- `src/components/famille/AjouterMembre.tsx` — formulaire d'ajout d'un membre
- `src/components/famille/AjouterAnecdote.tsx` — formulaire d'ajout d'anecdote sur un membre

---

## 3. Navigation

Ajout de deux entrées dans `src/components/NavBar.tsx` :
- 📦 **Souvenirs** → `/memoire`
- 🌳 **Famille** → `/famille`

---

## 4. Contraintes

- **Mobile first** — les filles utilisent principalement téléphone/tablette
- **Pas de graphe SVG complexe** pour l'arbre — grille de cartes plus lisible sur mobile
- **Rotation déterministe** des polaroïds — calculée depuis `id.charCodeAt(0) % 7 - 3` (évite `Math.random()`)
- **Papa ID hardcodé** dans les RLS : `b6025d5f-77d5-4208-b489-bcc717ebc01c`
- **Réutilisation** des créations de l'atelier (`creations` table existante) pour les dessins de Sarah
